/* AudioWorklet: Convert Float32 to PCM16 for AssemblyAI streaming */
const MAX_16BIT_INT = 32767;

class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    try {
      const input = inputs[0];
      if (!input) throw new Error('No input');

      const channelData = input[0];
      if (!channelData) throw new Error('No channelData');

      const float32Array = Float32Array.from(channelData);
      const int16Array = Int16Array.from(
        float32Array.map((n) => Math.max(-1, Math.min(1, n)) * MAX_16BIT_INT)
      );
      this.port.postMessage({ audio_data: int16Array.buffer });

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

registerProcessor('audio-processor', AudioProcessor);
