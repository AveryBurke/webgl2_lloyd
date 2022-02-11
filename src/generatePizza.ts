import pathToPoints from "./pathToPoints";
import { arc, pie } from "d3-shape";
import { rollup } from "d3-array";
import { roundRand } from "./helpers";

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
                        arcCount:arcCount.get(slice) ? arcCount.get(slice).get(ring) ? arcCount.get(slice).get(ring) : 0 : 0,
                        sliceCount:sliceCount.get(slice) || 0,
                        ringCount:ringCount.get(ring) || 0,
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
            const width = theta * outerRadius 
            const r = Math.min((outerRadius - innerRadius),width)/2
            const d = 2 * r 
            const numberOfCentroids = Math.floor((width/d))
            const centroids:[number,number][] = []
            // d3's arc.cenroid funciton appears to fail when the arc is a circle
            const isACircle = innerRadius === 0 && Math.round(theta * 180/Math.PI) === 360
            const [x, y] = !isACircle ? centroid : [0,0]
            const centroidR = Math.hypot(x,y)
            // const centroidR = Math.sqrt((x * x) + (y * y))
            const centroidTheta = Math.atan2(y,x)
            if (!isACircle){
                for (let i = 0; i < numberOfCentroids; i++) {
                    //fan out the nuclie along the arc
                    const leftOrRight = i % 2 === 0 ? 1 : -1
                    const cx = centroidR * (Math.cos(centroidTheta + ((i * d) * leftOrRight)))
                    const cy = centroidR * (Math.sin(centroidTheta + ((i * d) * leftOrRight)))
                    centroids.push([cx,cy])
                }
            } else {
                centroids.push([x,y])
            }       
            // const secondCentroid = [-centroid[0],-centroid[1]]
            const normalizeBy = isACircle ? radius : 2 * radius
            return [...new Array(arcCount)].reduce<number[]>((points,_) => {  
                    const c = roundRand(0,centroids.length > 0 ? centroids.length : centroids.length)
                    const [x,y] = centroids[c]
                    const pt_angle = Math.random() * 2 * Math.PI;
                    const pt_radius_sq = Math.random() * r * r;
                    const pt_x = x + Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
                    const pt_y = y + Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
                    return [...points,pt_x/normalizeBy + .5,pt_y/normalizeBy + .5]
                },[])           
        }

        return arcs.map(arc => {
            const {endAngle,startAngle} = arc
            const theta = endAngle - startAngle
            const path = arcGenerator(arc) 
            const boarder = pathToPoints(arc.arcCount > 0 ? 100 : 0,path)//<--the number of boarder points must be optomized, this is a bottle neck
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
