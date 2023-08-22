// because you cannot do myString[index] = value
export function setCharacterAt(value: string, index: number, character: string): string {
    return value.substring(0, index) + character + value.substring(index + 1)
}

// converts a date to the hh:mm:ss format
export function timeString(time: Date): string {
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    const seconds = time.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
}

// checks if a character is alphabetic
export function isAlphabetic(character: string): boolean {
    return (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z')
}

// checks if a character is a digit
export function isDigit(character: string): boolean {
    return character >= '0' && character <= '9'
}

// checks if a character is alphabetic or a digit
export function isAlphabeticDigit(character: string): boolean {
    return isDigit(character) || isAlphabetic(character)
}