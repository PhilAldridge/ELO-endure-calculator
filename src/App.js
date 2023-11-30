import './App.css';
import { updateRatingsAfterRace } from './lib/calcFunction.ts';
import ResultComponent from './component/ResultComponent.tsx';
function App() {
var players = [
  {name:"Red", rating: 4, k:0.25},
  {name:"Green", rating: 4,k:0.25},
  {name:"Blue", rating: 4,k:0.25},
  {name:"White", rating: 4,k:0.25},
  {name:"Purple", rating: 4,k:0.24},
  {name:"Orange", rating: 4,k:0.250},
  {name:"Yellow", rating: 4,k:0.2511},
];
const raceOne = ["Red", "Green", "Blue"]
const raceTwo = ["Blue","White", "Purple", "Yellow"]
const raceThree = ["Orange", "Purple", "White", "Yellow"];
const initial = players;
const resultOne = updateRatingsAfterRace(players,raceOne);
const resultTwo = updateRatingsAfterRace(resultOne,raceTwo);
const resultThree = updateRatingsAfterRace(resultTwo,raceThree);
  return (
    <div className="App">
      <ResultComponent players={initial} results={[]}/>
      <ResultComponent players={resultOne} results={raceOne} />
      <ResultComponent players={resultTwo} results={raceTwo} />
      <ResultComponent players={resultThree} results={raceThree}/>
    </div>
  );
}

export default App;
