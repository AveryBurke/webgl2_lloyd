//this is a model of how textrues work, for my own eddification

let outcolor:number
let gl_FragCoord:{x:number,y:number} = {x:0,y:0}
function multBy2(src:number[],rows:number) {
    return function (){
        const to1D = (gl_FragCoord.y * rows) + gl_FragCoord.x
        console.log('crruent 1d source index : ', to1D)
        console.log('source value is: ', src[to1D])
        console.log('setting outcolor to: ', src[to1D] * 2)
        outcolor = src[to1D] * 2
    }
}
function srcTodst(dst:number[],rows:number,columns,fn){
    for (let y = 0; y < columns; y++) {
        for (let x = 0; x < rows; x++) {
            console.log('the fragment coord is : ', {x,y})
            gl_FragCoord = {x,y}
            fn()
            const to1D = (gl_FragCoord.y * rows) + gl_FragCoord.x
            dst[to1D] = outcolor
        }
    }
}

const numberOfSites = 10
function rand(min:number, max:number) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
}

const src = [...new Array(numberOfSites * 2)].map((_,i) => rand(-1,1))
const dst = new Array(numberOfSites * 2) //<--- this is the texture, textrues are 2D
srcTodst(dst, 2, numberOfSites, multBy2(src,2))
console.log('dst: ', dst)