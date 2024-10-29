import { inflateSync, deflateSync } from 'fflate';
import type { ArticleType as Article } from '$lib/types';


function compress(articles: Article[]): string {
    const jsonStr = JSON.stringify(articles);
    const encoded = deflateSync(new TextEncoder().encode(jsonStr));
    let binaryString = '';
    for (let i = 0; i < encoded.length; i++) {
        binaryString += String.fromCharCode(encoded[i]);
    }
    return btoa(binaryString);
}

function decompress(compressedArticles: string): Article[] {
    const base64Data = compressedArticles;
    const binaryString = atob(base64Data);
    const data = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        data[i] = binaryString.charCodeAt(i);
    }

    const decompressedData = inflateSync(data);
    return uint8ArrayToArticle(decompressedData);
}

function uint8ArrayToArticle(uint8Array: Uint8Array): Article[] {
    try {
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(uint8Array);
        return JSON.parse(jsonStr) as Article[];
    } catch (error) {
        console.error("Failed to convert Uint8Array to Article[]", error);
        throw error;
    }
}

export { compress, decompress }