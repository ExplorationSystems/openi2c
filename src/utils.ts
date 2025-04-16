export async function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function mapValue(current: number, inMin = 0, inMax = 1, outMin = 0, outMax = 1) {
    const mapped = ((current - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return mapped;
}

export type Integer = number & { __brand: "integer" };

/**
 * Truncate decimal part of a number value and convert to `Integer`.
 * 
 * @param num number to be truncated
 * @returns 
 */
export function truncateToInteger(num: number): Integer {
    return Number.parseInt( num.toFixed(0) ) as Integer;
}

/**
 * Put number's bytes into array, LSB first.
 * 
 * @param num Number to be converted.
 */
export function arrayify(num: Integer): number[] {
    let ret: number[] = [];
    for (let i = 0; num >> (8*i); i++) {
        ret.push((num >> (8*i)) & 0xff)
    }
    return ret;
}
