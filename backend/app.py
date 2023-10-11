from flask import Flask, request, jsonify, Response
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_cors import cross_origin
from transformers import (
    WhisperFeatureExtractor,
    WhisperTokenizer,
    WhisperProcessor,
    WhisperForConditionalGeneration,
)
from pydub import AudioSegment
import torch
import torchaudio
import os
import logging
import logging
import librosa
import tempfile
import librosa.display
import numpy as np
from transformers import pipeline
import youtube_dl
from pytube import YouTube
from flask_socketio import SocketIO, send, emit


logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
# CORS(app, origins=["http://localhost:3000"])
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

ALLOWED_EXTENSIONS = {"wav"}


# Configure the maximum allowed upload file size (in bytes)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 16MB


def preprocess_audio(audio_file_path):
    waveform, sample_rate = librosa.load(audio_file_path)
    if sample_rate != 16000:
        # Resample audio to 16kHz if not already
        resampler = torchaudio.transforms.Resample(
            orig_freq=sample_rate, new_freq=16000
        )
        waveform = resampler(waveform)
    return waveform, 16000


# Load the model and processor when server starts
processor = WhisperProcessor.from_pretrained("openai/whisper-base")
model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base")
model.config.forced_decoder_ids = None

small_processor = WhisperProcessor.from_pretrained("openai/whisper-small")
small_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small")
small_model.config.forced_decoder_ids = None

md_processor = WhisperProcessor.from_pretrained("openai/whisper-medium")
md_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-medium")
md_model.config.forced_decoder_ids = None

device = "cuda:1" if torch.cuda.is_available() else "cpu"
print(device)
pipe = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    chunk_length_s=5,
    device=device,
)


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
            # model, processor = load_model()

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


# Route for uploading audio files
@app.route("/small_whisper_transcribe", methods=["POST"])
def small_whisper_transcribe():
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
            # model, processor = load_model()

            input_features = small_processor(
                audio, sampling_rate=16000, return_tensors="pt"
            ).input_features

            print("Processor Output:", input_features)

            # Generate transcriptions
            with torch.no_grad():
                predicted_ids = small_model.generate(
                    input_features,
                    num_beams=4,
                    length_penalty=0.6,
                    max_length=512,  # You can adjust this max length as needed
                    min_length=1,
                    no_repeat_ngram_size=3,
                    early_stopping=True,
                )

            # # Decode the output
            transcription = small_processor.batch_decode(
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


# Route for uploading audio file
@app.route("/md_whisper_transcribe", methods=["POST"])
def md_whisper_transcribe():
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
            # model, processor = load_model()

            input_features = md_processor(
                audio, sampling_rate=16000, return_tensors="pt"
            ).input_features

            print("Processor Output:", input_features)

            # Generate transcriptions
            with torch.no_grad():
                predicted_ids = md_model.generate(
                    input_features,
                    num_beams=4,
                    length_penalty=0.6,
                    max_length=512,  # You can adjust this max length as needed
                    min_length=1,
                    no_repeat_ngram_size=3,
                    early_stopping=True,
                )

            # # Decode the output
            transcription = md_processor.batch_decode(
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


# Route for uploading audio file
@app.route("/long_whisper_transcribe", methods=["POST"])
def long_whisper_transcribe():
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

            bit_depth = 16  # 16-bit audio
            duration_in_seconds = len(audio) / sample_rate
            number_of_samples = int(duration_in_seconds * sample_rate)

            content_length = number_of_samples * (bit_depth // 8)

            # Log a success message
            app.logger.info(
                "Audio file uploaded and processed successfully in long whisper model."
            )

            # Initialize the pipeline for ASR
            transcription_pipe = pipeline(
                "automatic-speech-recognition",
                model="openai/whisper-small",
                chunk_length_s=30,
                device=device,
            )

            # Define a generator function for streaming responses
            def generate_transcriptions():
                # Split audio into chunks and transcribe each chunk
                chunk_size = 5  # Adjust as needed
                for i in range(0, len(audio), chunk_size * sample_rate):
                    chunk_start = i
                    chunk_end = min(i + chunk_size * sample_rate, len(audio))
                    chunk = audio[chunk_start:chunk_end]

                    # Generate transcriptions for the current chunk
                    transcription = transcription_pipe(chunk, batch_size=8)["text"]

                    # Send the partial transcription as a response
                    yield transcription + "\n"  # Use newline delimiter for each chunk

            # Return a streaming response
            response = Response(generate_transcriptions(), content_type="text/plain")

            # Calculate and set the Content-Length header
            # response.headers["Content-Length"] = str(content_length)

            return response

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        # Add additional logging or print statements here
        return jsonify({"error": "An error occurred while processing the audio."}), 500


# Define your route for extracting audio
# @app.route("/extract_audio", methods=["POST"])
# def extract_audio():
#     try:
#         print("Video sent to backend")
#         # Get the video URL from the JSON request
#         video_url = request.json.get("videoUrl")

#         if not video_url:
#             return jsonify({"error": "Video URL is missing in the request."}), 400

#         # Set options for youtube-dl to extract audio
#         ydl_opts = {
#             "format": "bestaudio/best",
#             "postprocessors": [
#                 {
#                     "key": "FFmpegExtractAudio",
#                     "preferredcodec": "wav",  # Specify WAV format here
#                     "preferredquality": "192",
#                 }
#             ],
#             "outtmpl": "audio.wav",  # Output file name with WAV extension
#             "extractaudio": True,  # Ensure audio extraction is enabled
#             "audioformat": "wav",  # Specify the audio format
#             "verbose": True,  # Add this line
#         }
#         print("ydl_opts done")

#         with youtube_dl.YoutubeDL(ydl_opts) as ydl:
#             info = ydl.extract_info(video_url, download=False)
#             ydl.download([video_url])

#         print("with function")

#         # Process the audio file here (if needed)
#         # For now, let's assume no additional processing is required

#         # Create a temporary directory to store audio files
#         with tempfile.TemporaryDirectory() as temp_dir:
#             temp_audio_path = os.path.join(temp_dir, "audio.wav")

#             # Save the uploaded audio as "audio.wav" in the temporary directory
#             audio_file = request.files[
#                 "audio"
#             ]  # Assuming you're uploading the audio as a file
#             audio_file.save(temp_audio_path)

#             # Load the uploaded audio using librosa
#             audio, sample_rate = librosa.load(temp_audio_path)

#             # Rest of your audio processing code (if needed)

#             # Initialize the pipeline for ASR (Automatic Speech Recognition)
#             # Specify the device you want to use (e.g., "cpu" or "cuda")
#             device = "cpu"  # Change this to the desired device
#             transcription_pipe = pipeline(
#                 "automatic-speech-recognition",
#                 model="openai/whisper-small",
#                 device=device,
#             )

#             # Define a generator function for streaming transcriptions
#             def generate_transcriptions():
#                 # Split audio into chunks and transcribe each chunk
#                 chunk_size = 5  # Adjust as needed
#                 for i in range(0, len(audio), chunk_size * sample_rate):
#                     chunk_start = i
#                     chunk_end = min(i + chunk_size * sample_rate, len(audio))
#                     chunk = audio[chunk_start:chunk_end]

#                     # Generate transcriptions for the current chunk
#                     transcription = transcription_pipe(chunk)["text"]

#                     # Send the partial transcription as a response
#                     yield transcription + "\n"  # Use newline delimiter for each chunk

#             # Return a streaming response with transcriptions
#             response = Response(generate_transcriptions(), content_type="text/plain")

#             # Calculate and set the Content-Length header (optional)
#             response.headers["Content-Length"] = str(len(audio))

#             return response

#     except Exception as e:
#         app.logger.error(f"Error: {str(e)}")
#         # Add additional logging or print statements here
#         return jsonify({"error": "An error occurred while processing the audio."}), 500


# @app.route("/extract_audio", methods=["POST"])
# def extract_audio():
#     video_url = request.json.get("videoUrl")

#     if not video_url:
#         return jsonify({"error": "Video URL is missing in the request."}), 400

#     try:
#         # Create a YouTube object and set the video URL
#         yt = YouTube(video_url)

#         # Get the best audio stream (adjust as needed)
#         audio_stream = yt.streams.filter(only_audio=True, file_extension="mp4").first()

#         if not audio_stream:
#             return jsonify({"error": "Unable to extract audio stream."}), 500

#         # Download the audio stream
#         audio_stream.download(output_path="audio")

#         # Return success message or perform further processing here
#         return jsonify({"message": "Audio extracted successfully.", })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


@app.route("/extract_audio", methods=["POST"])
def extract_audio():
    video_url = request.json.get("videoUrl")

    if not video_url:
        return jsonify({"error": "Video URL is missing in the request."}), 400

    try:
        # Create a YouTube object and set the video URL
        yt = YouTube(video_url)

        # Get the best audio stream (adjust as needed)
        audio_stream = yt.streams.filter(only_audio=True, file_extension="mp4").first()

        if not audio_stream:
            return jsonify({"error": "Unable to extract audio stream."}), 500

        # Download the audio stream
        audio_stream.download(output_path="audio")

        # Define the path to the downloaded audio file
        audio_file_path = os.path.join("audio", f"{yt.title}.mp4")

        # Initialize the pipeline for ASR
        transcription_pipe = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-small",
            chunk_length_s=30,
            device="cpu",  # Change this to your desired device
        )

        # Define a generator function for streaming responses
        def generate_transcriptions():
            # Split audio into chunks and transcribe each chunk
            chunk_size = 5  # Adjust as needed
            audio, sample_rate = librosa.load(audio_file_path)
            for i in range(0, len(audio), chunk_size * sample_rate):
                chunk_start = i
                chunk_end = min(i + chunk_size * sample_rate, len(audio))
                chunk = audio[chunk_start:chunk_end]

                # Generate transcriptions for the current chunk
                transcription = transcription_pipe(chunk, batch_size=8)[0]["text"]

                # Send the partial transcription as a response
                yield transcription + "\n"  # Use newline delimiter for each chunk

        # Return a streaming response
        response = Response(generate_transcriptions(), content_type="text/plain")

        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# # Route to transcribe recorded audio
# @app.route("/upload_audio_chunk", methods=["POST"])
# def upload_audio_chunk():
#     try:
#         audio_chunk = request.files.get("audio")

#         if not audio_chunk:
#             app.logger.error("No audio chunk provided.")
#             return jsonify({"error": "No audio chunk provided."}), 400
#         app.logger.info("Received an audio chunk.")

#         # Create a temporary directory to store audio chunks
#         with tempfile.TemporaryDirectory() as temp_dir:
#             temp_audio_path = os.path.join(temp_dir, "audio.wav")

#             # Save the uploaded audio chunk as "audio.wav" in the temporary directory
#             audio_chunk.save(temp_audio_path)

#             # Load the uploaded audio using librosa
#             audio, sample_rate = librosa.load(temp_audio_path)

#             # Transcribe the audio chunk
#             transcription = asr_pipeline(audio, sample_rate=sample_rate)[0]["text"]

#         return jsonify(
#             {
#                 "message": "Audio chunk transcribed successfully.",
#                 "transcription": transcription,
#             }
#         )

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# Initialize the ASR pipeline with the "openai/whisper-small" model
transcription_pipe = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    chunk_length_s=5,  # Adjust chunk length as needed
    device=0 if torch.cuda.is_available() else -1,  # Use GPU if available
)


@socketio.on("connect")
def handle_connect():
    print("Client connecteddd")


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


@socketio.on("audio_data")
def handle_audio_data(audio_data):
    try:
        print(
            "Received audio data:", len(audio_data), "bytes"
        )  # Log the received data length

        # Convert the received audio data to a NumPy array
        audio_array = np.array(audio_data)

        # Transcribe the audio
        # transcription = transcribe_audio(audio_array)
        transcription = transcription_pipe(audio_array)

        # Send the transcription back to the frontend
        emit("transcription", transcription)

    except Exception as e:
        print("Error:", e)


def transcribe_audio(audio_data):
    # Save the received audio data as a temporary WAV file
    temp_audio_path = "temp_audio.wav"
    librosa.output.write_wav(temp_audio_path, audio_data, 16000)

    # Load the audio using librosa
    audio, sample_rate = librosa.load(temp_audio_path, sr=None)

    # Transcribe the audio using the ASR pipeline
    transcription = transcription_pipe(audio)

    return transcription


if __name__ == "__main__":
    print("Flask backend started running!")
    socketio.run(app, host="localhost", port=5000, allow_unsafe_werkzeug=True)

    # app.run(debug=True)
