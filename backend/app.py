from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
from transformers import (
    WhisperFeatureExtractor,
    WhisperTokenizer,
    WhisperProcessor,
    WhisperForConditionalGeneration,
)

from pydub import AudioSegment
import whisper
import io
import torch
import torchaudio
import openai
import os
import logging
from huggingface_hub import HfApi, HfFolder
import base64
import json
import logging
import librosa
import tempfile
import librosa.display
import numpy as np
import tokenizers

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
CORS(app, origins=["http://localhost:3000"])
ALLOWED_EXTENSIONS = {"wav"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# Configure the maximum allowed upload file size (in bytes)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB


def is_supported_audio_format(file):
    try:
        audio = AudioSegment.from_file(file)
        return True
    except Exception as e:
        print("Unsupported audio format:", str(e))
        return False


def preprocess_audio(audio_file_path):
    waveform, sample_rate = librosa.load(audio_file_path)
    if sample_rate != 16000:
        # Resample audio to 16kHz if not already
        resampler = torchaudio.transforms.Resample(
            orig_freq=sample_rate, new_freq=16000
        )
        waveform = resampler(waveform)
    return waveform, 16000


def load_model():
    # load model and processor
    processor = WhisperProcessor.from_pretrained("openai/whisper-base")
    model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base")
    model.config.forced_decoder_ids = None

    return model, processor


# Route for uploading audio files
@app.route("/whisper_transcribe", methods=["POST"])
def whisper_transcribe():
    try:
        app.logger.debug("Received POST data: %s", request.data)

        # Check if the 'audio' field is in the request
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided."}), 400

        audio_file = request.files["audio"]

        # Check if the file is empty
        if audio_file.filename == "":
            return jsonify({"error": "Empty file provided."}), 400

        # Create a temporary directory to store audio files
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_audio_path = os.path.join(temp_dir, "audio.wav")

            # Save the uploaded audio as "audio.wav" in the temporary directory
            audio_file.save(temp_audio_path)

            audio, sample_rate = librosa.load(temp_audio_path)

            # Log a success message
            app.logger.info("Audio file uploaded and processed successfully.")

            # # Load model and tokenizers
            model, processor = load_model()

            input_features = processor(
                audio, sampling_rate=16000, return_tensors="pt"
            ).input_features

            print("Processor Output:", input_features)

            # Generate transcriptions
            with torch.no_grad():
                predicted_ids = model.generate(
                    input_features,
                    num_beams=4,
                    length_penalty=0.6,
                    max_length=512,  # You can adjust this max length as needed
                    min_length=1,
                    no_repeat_ngram_size=3,
                    early_stopping=True,
                )

            # # Decode the output
            transcription = processor.batch_decode(
                predicted_ids, skip_special_tokens=True
            )

            print(transcription)

        return jsonify(
            {
                "message": "Audio file uploaded successfully.",
                "sr": sample_rate,
                "transcription": transcription,
            }
        )

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        # Add additional logging or print statements here
        return jsonify({"error": "An error occurred while processing the audio."}), 500


if __name__ == "__main__":
    print("Flask backend is running!")
    app.run(debug=True)