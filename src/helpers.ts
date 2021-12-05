/* 
    Helper Functions
*/


/* Calculate next execution time, throws error if cron expression is invalid */
export async function nextExecTime(exp: string, afterTime?: Date): Promise<Date> {

    let expArr: Array<string> = exp.split(' ');
    
    // return potential values
    try {
        
        // minute
        let min: Array<number> = await validateExpression(expArr[0], 59);

        // hour
        let hour: Array<number> = await validateExpression(expArr[1], 23);

        // day of month
        let day: Array<number> = await validateExpression(expArr[2], 30);

        // month
        let month: Array<number> = await validateExpression(expArr[3], 11);

        // day of week
        let weekday: Array<number> = await validateExpression(expArr[4], 6);

        // Calculate next value

        // current date
        let next = new Date();

        // increment now by 1 min to ensure date isn't now
        next.setTime(next.getTime() + 1000 * 60);
        
        // always set seconds to 0
        next.setSeconds(0);

        // if after date specified
        if (afterTime) next.setTime(afterTime.getTime() + 1000 * 60);

        // Increment potential date until it matches potential cron values
        while(true) {

            // Month
            if(!month.includes(next.getMonth())) {
                next.setDate(day[0]);
                next.setHours(hour[0]);
                next.setMinutes(min[0]);
                next.setMonth(next.getMonth()+1);
                continue;
            }
            // Day
            if(!day.includes(next.getDate())) {
                next.setHours(hour[0]);
                next.setMinutes(min[0]);
                next.setDate(next.getDate()+1);
                continue;
            }
            // Weekday
            if(!weekday.includes(next.getDay())) {
                next.setHours(hour[0]);
                next.setMinutes(min[0]);
                next.setDate(next.getDate()+1);
                continue;
            }
            // Hour
            if(!hour.includes(next.getHours())) {
                next.setMinutes(min[0]);
                next.setHours(next.getHours()+1);
                continue;
            }
            // Minute
            if(!min.includes(next.getMinutes())) {
                next.setMinutes(next.getMinutes()+1);
                continue;
            }
            break;
        }

        return next;

    } catch (error) {
        throw error;
    }

}

/* validate cron syntax section of full expression */
async function validateExpression(exp: string, maxVal: number): Promise<Array<number>> {

    // Array to store possible values (in number form)
    let arr: Array<number> = [];

    // replace any month or weekday text
    let textMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
    let textDays = ['MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN'];

    if (textMonths.some(v => exp.includes(v))) {

        // replace these values
        textMonths.forEach((m: string, i: number) => {
            if (exp.includes(m)) exp.replace(m, i.toString());
        });
    }

    if (textDays.some(v => exp.includes(v))) {

        // replace these values
        textDays.forEach((m: string, i: number) => {
            if (exp.includes(m)) exp.replace(m, i.toString());
        });
    }

    // Create Arrays of values
    try {
        
        if (exp.includes('*') && !exp.includes('/')) {

            // Array is all values
            arr = [...Array(maxVal + 1).keys()];

        } else if (exp.includes('-')) {

            // Array is values between start-stop
            let items = exp.split('-');
            let start = parseInt(items[0]);
            let stop = parseInt(items[1]);
            let range = stop - start;

            arr = [...Array(range).keys()].map(v => v + start);

        } else if (exp.includes(',')) {

            // Array is each specified value
            arr = exp.split(',').map(v => parseInt(v));

        } else if (exp.includes('/')) {

            let slashArr = exp.split('/');

            let start: number;
            let newArr: Array<number> = []

            if (slashArr[0] === '*') {
                start = 0;
            } else {
                start = parseInt(slashArr[0]);
            }

            let skip: number = parseInt(slashArr[1]);

            let currentValue: number = start;

            // loop through possible values
            while (currentValue < maxVal) {

                // include in possible values
                newArr.push(currentValue);

                // add skip amount
                currentValue += skip;
            }

            arr = newArr;

        } else if (!isNaN(parseInt(exp))) {

            arr = [parseInt(exp)];

        } else {
            throw new Error('cannot parse cron expression');
        }

        // bad value catch
        if(arr.some((v:any) => isNaN(v))) throw 'value is NaN';
        if(arr.some((v:any) => v > maxVal)) throw 'value > max';
        if(arr.some((v:any) => v < 0)) throw 'value < 0';

        return arr;

    } catch (error) {
        throw error;
    }
}

/* convert Milliseconds to string representation + unit label */
export function msToString(ms: number): string {

    let sec = 1000;
    let min = 60000;
    let hr = 3600000;
    let day = 86400000;

    if (ms < sec) {
        return ms + 'ms';
    } else if (ms < min) {
        return Math.round(ms / sec * 10)/10 + 'sec'
    } else if (ms < hr) {
        return Math.round(ms / min * 10)/10 + 'min'
    } else if (ms < day) {
        return Math.round(ms / hr * 10)/10 + 'hr'
    } else {
        return Math.round(ms / day * 10)/10 + 'day'
    }
}

/* parse JSON date strings to Date() */
export function parseJsonDates(key: string, value:any):any {
            
    // this could be automatic, but since its just 3 params now this is easier
    if (['nextRunTime', 'lastRunStartTime', 'lastRunStopTime'].includes(key)) {
        return new Date(value);
    }
    return value
}