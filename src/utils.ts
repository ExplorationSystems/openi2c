export async function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function mapValue(current: number, inMin = 0, inMax = 1, outMin = 0, outMax = 1) {
    const mapped = ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return mapped;
}

export function toSigned16Bit(n) {
    return (n & 0x8000) ? n - 0x10000 : n;
  }
  
