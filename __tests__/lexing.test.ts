import { isAlphabetic, isAlphabeticInteger } from '../src/compiler'

const expectedOutputsForIsAlphabetic: [string, boolean][] = [
    ['z', true],
    ['A', true],
    ['Z', true],
    ['c', true],
    ['C', true],
    ['#', false],
    [':', false],
    ['9', false],
    ['0', false],
    ['3', false]
]

const expectedOutputsForIsAlphabeticInteger: [string, boolean][] = [
    ['z', true],
    ['A', true],
    ['Z', true],
    ['c', true],
    ['C', true],
    ['#', false],
    [':', false],
    ['9', true],
    ['0', true],
    ['3', true]
]

describe('Testing functions', () => {
    test('Testing isAlphabetic', () => {
        expectedOutputsForIsAlphabetic.forEach(output => {
            expect(isAlphabetic(output[0])).toBe(output[1])
        })
        expectedOutputsForIsAlphabeticInteger.forEach(output => {
            expect(isAlphabeticInteger(output[0])).toBe(output[1])
        })
    })
})