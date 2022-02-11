import generatePizza from "./generatePizza";
import { roundRand } from "./helpers";

function randomPizza(count:number,slices:string,rings:string,maxslices:number,maxRings:number) {
    const numberOfSlices = roundRand(1,maxslices)
    const numberOfRings = roundRand(1,maxRings)
    const sliceSet = [...new Set([...new Array(numberOfSlices)].map((_,i) => slices[roundRand(0,slices.length - 1)]))]
    const ringSet = [...new Set([...new Array(numberOfRings)].map((_,i) => rings[roundRand(0,rings.length - 1)]))]
    const data = [...new Array(count)].map((_,i) => {
        const sliceValue = sliceSet[roundRand(0,sliceSet.length - 1)]
        const ringValue = ringSet[roundRand(0,ringSet.length - 1)]
        return ({sliceValue,ringValue})
    })

    return generatePizza({data,sliceSet,ringSet,radius:300})
}
export default randomPizza