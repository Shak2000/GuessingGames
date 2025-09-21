# Gemini TTS Setup Guide

This guide will help you set up Google Cloud Text-to-Speech with Gemini 2.5 Flash Preview TTS for your Multi-Game App.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with billing enabled
2. **Text-to-Speech API**: Enable the Cloud Text-to-Speech API in your project
3. **Credentials**: Set up authentication for your application

## Step 1: Install Dependencies

Install the required Google Cloud Text-to-Speech library:

```bash
pip install google-cloud-texttospeech>=2.29.0
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

## Step 2: Enable the Text-to-Speech API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Cloud Text-to-Speech API"
5. Click on it and press **Enable**

## Step 3: Set Up Authentication

### Option A: Service Account Key (Recommended for Development)

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Give it a name like "tts-service-account"
4. Assign the role **Text-to-Speech User** (or **Editor** for broader access)
5. Click **Create and Continue**, then **Done**
6. Click on the created service account
7. Go to the **Keys** tab
8. Click **Add Key** > **Create New Key** > **JSON**
9. Download the JSON file and save it securely

Set the environment variable to point to your credentials:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/credentials.json"
```

### Option B: Application Default Credentials (for Production)

Install and initialize the Google Cloud CLI:

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

## Step 4: Verify Your Setup

Test your setup by running the application and trying the voice test feature:

1. Start your FastAPI server:
   ```bash
   python -m uvicorn app:app --reload
   ```

2. Navigate to `http://localhost:8000/settings`
3. Select a voice (e.g., "Zephyr")
4. Click "Test Voice" - you should hear audio!

## Step 5: Available Gemini TTS Voices

Your application supports all 30 Gemini TTS voices:

### Female Voices
- Achernar, Aoede, Autonoe, Callirrhoe, Despina, Erinome, Gacrux
- Kore, Laomedeia, Leda, Pulcherrima, Sulafat, Vindemiatrix, Zephyr

### Male Voices  
- Achird, Algenib, Algieba, Alnilam, Charon, Enceladus, Fenrir
- Iapetus, Orus, Puck, Rasalgethi, Sadachbia, Sadaltager, Schedar
- Umbriel, Zubenelgenubi

## API Endpoints

Your application now includes these TTS endpoints:

### Test Voice
```
POST /api/test-voice
{
    "voice": "Zephyr",
    "text": "Hello! This is a test of the selected voice."
}
```

### Generate TTS with Custom Prompt
```
POST /api/generate-tts
{
    "voice": "Aoede",
    "text": "Welcome to our multi-game platform!",
    "prompt": "Say this in an excited and welcoming way"
}
```

## Troubleshooting

### Permission Denied
- Ensure the Text-to-Speech API is enabled
- Check that your service account has the `Cloud Text-to-Speech User` role
- Verify your credentials are set correctly

### Voice Not Found
- Make sure you're using a valid Gemini TTS voice name
- Check that you're using the correct model name: `gemini-2.5-flash-preview-tts`

### Import Error
- Ensure you've installed the Google Cloud Text-to-Speech library
- Run: `pip install google-cloud-texttospeech>=2.29.0`

## Cost Considerations

Gemini TTS pricing (as of 2024):
- **Gemini 2.5 Flash Preview TTS**: Cost-efficient for everyday applications
- Check the [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator) for current rates

## Security Notes

- Never commit your service account key to version control
- Use environment variables for credentials in production
- Consider using Google Cloud's Identity and Access Management (IAM) for fine-grained permissions

## Next Steps

1. **Integrate with your games**: Use the `/api/generate-tts` endpoint to add voice narration to your games
2. **Customize prompts**: Experiment with different prompts for various emotional tones
3. **Add voice selection UI**: Let users hear voice samples before choosing their preferred voice

For more information, see the [official Gemini TTS documentation](https://cloud.google.com/text-to-speech/docs/gemini-tts).
