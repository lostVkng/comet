/* 
    Creates a string ASCII based table from data
*/

/* creates table formatted string from header + row strings */
export function table(header: Array<string>, rows: Array<Array<string>>): string {

    let s:string = '';

    // calculate column widths 
    let _colW = [];

    // loop through columns and get max char for each col
    for(let i=0; i<header.length; i++) {
        let x = rows.map((x) => x[i]);
        let max = maxChar([header[i], ...x]);
        _colW.push(max);
    }

    // table width
    let tableW = _colW.reduce((a, b) => a + b, 0) + (_colW.length * 3) + 1;

    // header string
    s += '┌';
    for(let i=0; i<header.length; i++) {

        s += '─'.repeat(_colW[i]+2)

        if(i <= header.length-2 ) s += '┬';
    }
    s += '┐'+'\n';  

    s += '│';
    for (let i=0; i<header.length; i++) {
        // blue title
        let title = '\x1b[34m' + header[i] + '\x1b[0m';
        let diff = _colW[i] - header[i].length;
        let border = ' │';
        s += ' ' + title + ' '.repeat(diff) +  border;
    }
    s += '\n'; 

    s += '├';
    for(let i=0; i<header.length; i++) {
        s += '─'.repeat(_colW[i]+2);
        
        // end of header char
        if(i <= header.length-2) {
            s += '┼';
        } else if(i === header.length-1) {
            s += '┤'+'\n';   
        }
    }

    // loop through rows
    for(let ri=0; ri<rows.length; ri++) {
        s += '│';

        let row = rows[ri];

        for(let i=0; i<header.length; i++) {
            let item = row[i];
            let diff = _colW[i] - item.length;
            s += ' ' + item + ' '.repeat(diff) + ' │';
        }
        s += '\n'; 
    }

    // last row
    s += '└';
    for(let i=0; i<header.length; i++) {
        s += '─'.repeat(_colW[i]+2);
        
        // end of header char
        if(i <= header.length-2) {
            s += '┴';
        } else if(i === header.length-1) {
            s += '┘' +'\n';   
        }
    }
    
    return s;
}


/* calculates max character amount from string */
function maxChar(arr: Array<string>):number {

    let longestVal = arr.sort((a,b) => String(b).length - String(a).length)[0];
    let len = String(longestVal).length;

    return len
}
