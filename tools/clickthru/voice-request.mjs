/** Keep model-specific settings explicit; v3 does not support the v2 speed control. */
export function voiceRequest(text, model = "eleven_multilingual_v2") {
  if (!["eleven_multilingual_v2", "eleven_v3"].includes(model))
    throw new Error(
      "Supported narration models: eleven_multilingual_v2, eleven_v3.",
    );
  return {
    text,
    model_id: model,
    voice_settings:
      model === "eleven_v3"
        ? {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
          }
        : {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.1,
            use_speaker_boost: true,
            speed: 0.9,
          },
  };
}
