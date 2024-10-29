const models_list = ["all-MiniLM-L6-v2", "all-mpnet-base-v2"]
const BASE_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/';
const model = models_list[0];
export const HUGGINGFACE_API_URL = `${BASE_URL}${model}`;

// export const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/intfloat/multilingual-e5-large";

// export const HUGGINGFACE_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

// if (!HUGGINGFACE_TOKEN) {
//     throw new Error('The Hugging Face API token is not defined in the environment variables.');
// }

