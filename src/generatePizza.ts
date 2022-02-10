import pathToPoints from "./pathToPoints";
import { arc, pie } from "d3-shape";
import { rollup } from "d3-array";

const generatePizza = (
    {data,sliceSet,ringSet, radius}:
    {data:{sliceValue:string,ringValue:string}[]
    sliceSet:string[],
    ringSet:string[]
    radius:number
    }) => {
    
        const sliceCount = rollup(data, v => v.length, d => d.sliceValue)
        const ringCount = rollup(data, v => v.length, d => d.ringValue)
        const arcCount = rollup(data, v => v.length, d => d.sliceValue, d => d.ringValue)

        const sliceAngles = getSliceAngles(sliceSet)
        const ringHeight = radius/(ringSet.length)
        const arcs = generateArcs(sliceSet,ringSet)
        const arcGenerator = arc()
        function getSliceAngles(sliceSet:string[]) {
            const pieGenerator = pie<string>().value(slice => sliceCount.get(slice) || 0).sort((a:string,b:string) => sliceSet.indexOf(a) - sliceSet.indexOf(b))
            return Object.fromEntries(pieGenerator(sliceSet).map(p => {
                const {startAngle,endAngle} = p
                return [p.data, {startAngle,endAngle}]}))
        }
        
        function generateArcs(sliceSet:string[],ringSet:string[]) {
            const arcs = sliceSet.map(slice => {
                const {startAngle,endAngle} = sliceAngles[slice]
                return ringSet.map((ring, j) => {
                    const innerRadius = j * ringHeight
                    const outerRadius = (j + 1) * ringHeight
                    return ({
                        id:`${slice}_${ring}`,
                        arcCount: arcCount.get(slice).get(ring),
                        sliceCount:sliceCount.get(slice),
                        ringCount:ringCount.get(ring),
                        slice,
                        ring,
                        startAngle,
                        endAngle,
                        innerRadius,
                        outerRadius
                    })
                })
            })
            return arcs.flat()
        }

        //note: the nuclus funciton can be optomoized. calculate the size of the smallest enclosing cirlce
        //then calulate how many smalles circles can fit in the arc, then distribut the point randomly through
        //the give nucleii
        function generateNucleus(arc,centroid:[number,number]):number[] {
            const {innerRadius, outerRadius, arcCount, startAngle, endAngle} = arc
            const theta = endAngle - startAngle
            const width = (360/(radius/2 * theta)) * (2 * Math.PI * radius)  
            const r = Math.min((outerRadius - innerRadius),width)/2
            //d3's arc centriod funciton appears to fail when the arc is a circel
            const isACircle = innerRadius === 0 && Math.round(theta * 180/Math.PI) === 360
            const isARing = !isACircle && Math.round(theta * 180/Math.PI) === 360
            const [x, y] = !isACircle ? centroid : [0,0]
            const secondCentroid = [-centroid[0],-centroid[1]]
            const normalizeBy = isACircle ? radius : 2 * radius
            if (!isARing){
                return [...new Array(arcCount)].reduce<number[]>((points,_) => {
                    const pt_angle = Math.random() * 2 * Math.PI;
                    const pt_radius_sq = Math.random() * r * r;
                    const pt_x = x + Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
                    const pt_y = y + Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
                    return [...points,pt_x/normalizeBy + .5,pt_y/normalizeBy + .5]
                },[])
            } else {
                const topNuclius = [...new Array(Math.floor(arcCount/2))].reduce<number[]>((points,_) => {
                    const pt_angle = Math.random() * 2 * Math.PI;
                    const pt_radius_sq = Math.random() * r * r;
                    const pt_x = x + Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
                    const pt_y = y + Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
                    return [...points,pt_x/normalizeBy + .5,pt_y/normalizeBy + .5]
                },[])
                const bottomNuclius = [...new Array(Math.ceil(arcCount/2))].reduce<number[]>((points,_) => {
                    const pt_angle = Math.random() * 2 * Math.PI;
                    const pt_radius_sq = Math.random() * r * r;
                    const pt_x = secondCentroid[0] + Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
                    const pt_y = secondCentroid[1] + Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
                    return [...points,pt_x/normalizeBy + .5,pt_y/normalizeBy + .5]
                },[])

                return [...topNuclius,...bottomNuclius]
            }
           
        }

        return arcs.map(arc => {
            const path = arcGenerator(arc) 
            const boarder = pathToPoints(100,path)//<--the number of boarder points must be optomized, this is a bottle neck
            return({
                ...arc,
                path,
                boarder,
                centroid:arcGenerator.centroid(arc),
                nucleus:generateNucleus(arc,arcGenerator.centroid(arc))
            })
        })
}

export default generatePizza
