
import { prizes, colors } from "./PrizeWheel";

const PrizeList = () => {
  return (
    <div className="w-full max-w-md mt-6">
      <h3 className="text-xl font-bold mb-5 text-white">Premios por Aquirir un curso:</h3>
      <ul className="space-y-2 grid grid-cols-1 gap-2">
        {prizes.map((prize, index) => (
          <li
            key={index}
            className="flex items-center gap-2 p-3 text-white rounded-lg shadow-md border-4 border-blue-500 transform transition-transform hover:scale-105"
            style={{
              boxShadow: "0 4px 6px rgba(25, 152, 156, 0.603), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            <span className="font-bold text-sm">{prize.number}.</span>
            <span className="text-sm md:text-base font-medium">{prize.option}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrizeList;
