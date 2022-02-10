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
console.time('it took this long to normalize the pizza')
const boarders = pizza.reduce<number[]>((normalizedPoints,arc)=> {
    const {boarder} = arc
    const normalziedBoarder = boarder.reduce<number[]>((norm, pair) => [...norm,(pair[0]/1000) + .5, (pair[1]/1000) + .5],[])
    return [...normalizedPoints,...normalziedBoarder]
},[])
const nuclei = pizza.reduce<number[]>((nuclei,arc) => [...nuclei,...arc.nucleus],[])
console.timeEnd('it took this long to normalize the pizza')


const voroni = vornoiModual()
    .boarder(boarders)
    .nuclei(nuclei)
    .subscribe(result => draw(result))

voroni()

console.time('it took this long to get a result form voroni module after initilization')
voroni.render()
console.timeEnd('it took this long to get a result form voroni module after initilization')

function draw(points:number[]) {
    ctx.clearRect(0,0,canvasWidth * dpi,canvasHeight * dpi)
    points.forEach((_,i) =>{
        const x = points[i]
        const y = points[i + 1]
        if (i % 2 === 0){
            ctx.fillStyle = 'green'
            ctx.fillRect(x * canvasHeight * dpi,y * canvasWidth * dpi,10,10)
        }
    })
}






