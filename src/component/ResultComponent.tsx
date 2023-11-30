import React from 'react'

type Props = {
    players:player[],
    results:string[]
}

function ResultComponent({players, results}: Props) {
    const sortedPlayers = players.sort((a,b)=>b.rating-a.rating);
  return (
    <div className='resultComponent'>
        {results.length>0 && <h1>Results of the race: </h1>}
        <div className='results'>
            {results.map((result,i)=>{
                return <div key={i} className='result'>{result}</div>
            })}
        </div>
        <h2>Current Standings:</h2>
        {sortedPlayers.map(player=>{
            return <div key={player.name} className={'standings '+player.name}>{player.name}: {player.rating}</div>
        })}
    </div>
  )
}

export default ResultComponent