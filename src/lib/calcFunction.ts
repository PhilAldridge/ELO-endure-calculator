export function updateRatingsAfterRace(players:player[], raceResults:string[]){
    const playersCopy = JSON.parse(JSON.stringify(players))
    const kInfinity = calculateKInfinity(playersCopy);

    let raceResultPlayers:player[] = [];
    raceResults.forEach(playerName=>{
        const playerFound = playersCopy.find(player=> player.name === playerName);
        if(!playerFound) {
            const newPlayer = {name:playerName, rating:4, k:kInfinity}
            raceResultPlayers.push(newPlayer)
            playersCopy.push(newPlayer)
        } else {
            raceResultPlayers.push(playerFound)
        }
    })
    
    calculateRatings(raceResultPlayers,kInfinity);
    return playersCopy;
}

export function calculateRatings(raceResults: player[], kInfinity: number): player[] {
    const raceResultsCopy = [...raceResults];
    const knowledgeDecayFactor = 0.9;
    let newRatings: player[] = [];
    while(raceResultsCopy.length>0){
        const expSum = raceResultsCopy.reduce((a,b)=>{return a + Math.exp(-b.rating)},0);
        raceResultsCopy.forEach((player,index)=>{
            //probabilty = 1 - e^-rating/sum of all e^-ratings
            const probabilityOfSurvivingRound = 1-(Math.exp(-player.rating)/expSum);
            
            //adjustment of change multiplier: k^-1 += P(1-P)
            player.k =1/((1/player.k)+probabilityOfSurvivingRound*(1-probabilityOfSurvivingRound))

            if(player.lastPlayed===undefined){
                player.k = kInfinity;
            } else {
                //adjustment of change multiplier: k^-1 += P(1-P)
                player.k =1/((1/player.k)+probabilityOfSurvivingRound*(1-probabilityOfSurvivingRound))

                //adjust k factor for time since last test
                player.k += (1-Math.pow(knowledgeDecayFactor,(Date.now()-player.lastPlayed)/(60*60*24)))*(kInfinity-player.k)
            }

            //0 if eliminated, 1 if not
            const survivedModifier = index===raceResultsCopy.length-1? 0:1;

            //update rating
            player.rating += player.k*(survivedModifier-probabilityOfSurvivingRound);
            
        })
        newRatings.push(raceResultsCopy[raceResultsCopy.length-1])
        raceResultsCopy.pop();
    }
    newRatings.forEach(player=> {
        player.lastPlayed = Date.now();
    })
    return newRatings;
}

export function calculateKInfinity(allPlayers: player[]):number {
    let ratings: number[] = [];
    allPlayers.forEach(player=>{
        ratings.push(player.rating)
    })
    const {mean, sd} = findMeanAndStandardDeviation(ratings);
    
    //Assuming a normal distribution, where are the first and third quartiles.
    const quantileFnFirstQuartile = normInv(0.25, mean, sd);
    const quantileFnThirdQuartile = normInv(0.75,mean,sd);
    
    const exponentialRatingAtFirstQuartile = Math.exp(-quantileFromArray(ratings,0.25));
    const exponentialRatingAtThirdQuartile = Math.exp(-quantileFromArray(ratings, 0.75));

    //fail-safe to avoid division by 0. This only happens when all players have exactly the same rating (I think).
    if(exponentialRatingAtFirstQuartile===exponentialRatingAtThirdQuartile) return 0.5;

    //P = 1-e^-rating/(sum of e^-rating)
    const probabilityThatPlayerAtThirdQuartileBeatsPlayerAtFirstQuartile =1-(exponentialRatingAtThirdQuartile/(exponentialRatingAtFirstQuartile+exponentialRatingAtThirdQuartile));
    return (Math.log(probabilityThatPlayerAtThirdQuartileBeatsPlayerAtFirstQuartile/(1-probabilityThatPlayerAtThirdQuartileBeatsPlayerAtFirstQuartile))/(quantileFnThirdQuartile-quantileFnFirstQuartile))**2;
}

function findMeanAndStandardDeviation(numbers: number[]):{mean:number, sd:number} {
    const mean = numbers.reduce((a,b)=>{
        return a+b
    },0)/numbers.length;
    const arrayOfSquareDifferences = numbers.map((k)=> {
        return (k-mean)**2;
    })
    const variance = arrayOfSquareDifferences.reduce((a,b)=> a+b,0)/numbers.length;
    const sd = Math.sqrt(variance)

    return {mean:mean, sd:sd}
}


//stolen from https://gist.github.com/kmpm/1211922/6b7fcd0155b23c3dc71e6f4969f2c48785371292 
function normInv(p:number, mu:number, sigma:number):number
{
    if (p < 0 || p > 1)
    {
        throw new Error("The probality p must be bigger than 0 and smaller than 1");
    }
    if (sigma < 0)
    {
        throw new Error("The standard deviation sigma must be positive");
    }

    if (p === 0 || p===1)
    {
        return -Infinity;
    }
    if (sigma === 0)
    {
        return mu;
    }

    var q:number, r:number, val:number;

    q = p - 0.5;

    /*-- use AS 241 --- */
    /* double ppnd16_(double *p, long *ifault)*/
    /*      ALGORITHM AS241  APPL. STATIST. (1988) VOL. 37, NO. 3
            Produces the normal deviate Z corresponding to a given lower
            tail area of P; Z is accurate to about 1 part in 10**16.
    */
    if (Math.abs(q) <= .425)
    {/* 0.075 <= p <= 0.925 */
        r = .180625 - q * q;
        val =
               q * (((((((r * 2509.0809287301226727 +
                          33430.575583588128105) * r + 67265.770927008700853) * r +
                        45921.953931549871457) * r + 13731.693765509461125) * r +
                      1971.5909503065514427) * r + 133.14166789178437745) * r +
                    3.387132872796366608)
               / (((((((r * 5226.495278852854561 +
                        28729.085735721942674) * r + 39307.89580009271061) * r +
                      21213.794301586595867) * r + 5394.1960214247511077) * r +
                    687.1870074920579083) * r + 42.313330701600911252) * r + 1);
    }
    else
    { /* closer than 0.075 from {0,1} boundary */

        /* r = min(p, 1-p) < 0.075 */
        if (q > 0)
            r = 1 - p;
        else
            r = p;

        r = Math.sqrt(-Math.log(r));
        /* r = sqrt(-log(r))  <==>  min(p, 1-p) = exp( - r^2 ) */

        if (r <= 5)
        { /* <==> min(p,1-p) >= exp(-25) ~= 1.3888e-11 */
            r += -1.6;
            val = (((((((r * 7.7454501427834140764e-4 +
                       .0227238449892691845833) * r + .24178072517745061177) *
                     r + 1.27045825245236838258) * r +
                    3.64784832476320460504) * r + 5.7694972214606914055) *
                  r + 4.6303378461565452959) * r +
                 1.42343711074968357734)
                / (((((((r *
                         1.05075007164441684324e-9 + 5.475938084995344946e-4) *
                        r + .0151986665636164571966) * r +
                       .14810397642748007459) * r + .68976733498510000455) *
                     r + 1.6763848301838038494) * r +
                    2.05319162663775882187) * r + 1);
        }
        else
        { /* very close to  0 or 1 */
            r += -5;
            val = (((((((r * 2.01033439929228813265e-7 +
                       2.71155556874348757815e-5) * r +
                      .0012426609473880784386) * r + .026532189526576123093) *
                    r + .29656057182850489123) * r +
                   1.7848265399172913358) * r + 5.4637849111641143699) *
                 r + 6.6579046435011037772)
                / (((((((r *
                         2.04426310338993978564e-15 + 1.4215117583164458887e-7) *
                        r + 1.8463183175100546818e-5) * r +
                       7.868691311456132591e-4) * r + .0148753612908506148525)
                     * r + .13692988092273580531) * r +
                    .59983220655588793769) * r + 1);
        }

        if (q < 0.0)
        {
            val = -val;
        }
    }

    return mu + sigma * val;
}

function quantileFromArray(numbers: number[],quartile:number):number {
    const sorted = numbers.sort((a,b)=>a-b);
    const pos = (sorted.length-1)*quartile;
    const base = Math.floor(pos);
    const rest = pos-base;
    if(sorted[base+1] !== undefined) {
        return sorted[base] + rest*(sorted[base+1]-sorted[base])
    } else {
        return sorted[base]
    }
}