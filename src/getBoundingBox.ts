import svgPathBbox from 'svg-path-bbox';

function getBox(path:string){
    const [x0,y0,x1,y1] = svgPathBbox(path)
    const width = x1 - x0
    const height = y1 - y0
    return {bx:x0,by:y0,bx1:x1,by1:y1,bw:width,bh:height}
}
export default getBox