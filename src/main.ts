import vornoiModual from "./module";
import randomPizza from "./randomPizza";

const numberOfSites = 1000
const canvasWidth = 600
const canvasHeight = 600
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const dpi = window.devicePixelRatio
canvas.style.width = canvasWidth + 'px'
canvas.style.height = canvasHeight + 'px'
canvas.width = Math.floor(canvasWidth * dpi)
canvas.height = Math.floor(canvasHeight * dpi)
const slices = 'ABCDEFGHIJKLMN'
const rings = 'OPQRSTUVWXYZ'
console.time('it took this long to generate the pizza')
const pizza = randomPizza(numberOfSites,slices,rings,8,8)
console.timeEnd('it took this long to generate the pizza')
console.log(pizza)
console.time('it took this long to normalize the pizza')
const boarders = pizza.reduce<number[]>((normalizedPoints,arc)=> {
    const {boarder} = arc
    const normalziedBoarder = boarder.reduce<number[]>((norm, pair) => [...norm,(pair[0]/canvasWidth) + .5, (pair[1]/canvasHeight) + .5],[])
    return [...normalizedPoints,...normalziedBoarder]
},[])
const nuclei = pizza.reduce<number[]>((nuclei,arc) => [...nuclei,...arc.nucleus],[])
console.timeEnd('it took this long to normalize the pizza')

// draw(nuclei) 
drawArcs(pizza.map(arc => arc.path))
const voroni = vornoiModual()
    .boarder(boarders)
    .nuclei(nuclei)
    .numberOfCycles(50)
    .subscribe(result => draw(result))

voroni()

console.time('it took this long to get a result form voroni module after initilization')
voroni.render()
console.timeEnd('it took this long to get a result form voroni module after initilization')

function drawArcs(paths:string[]) {
    paths.forEach(path => {
        ctx.setTransform(dpi,0, 0, dpi, Math.floor(canvasWidth/2 * dpi), Math.floor(canvasHeight/2 * dpi))
        ctx.stroke(new Path2D(path))
    })
}

function draw(points:number[]) {
    ctx.setTransform(1,0, 0, 1, 0, 0)
    // ctx.clearRect(0,0,canvasWidth * dpi,canvasHeight * dpi)
    points.forEach((_,i) =>{
        const x = points[i]
        const y = points[i + 1]
        if (i % 2 === 0){
            ctx.fillStyle = 'green'
            ctx.fillRect(x * canvasHeight * dpi,y * canvasWidth * dpi,10,10)
        }
    })
}






