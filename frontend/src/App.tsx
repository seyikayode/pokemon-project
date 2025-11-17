import PokemonList from './components/PokemonList';
import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Poke Manager</h1>

      </header>
      <main>
        <PokemonList />
      </main>
    </div>
  );
}

export default App;