
import { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface DisplayBeneficiary {
  id?: string;
  name: string;
  dni: string;
  date: string;
  prize?: string;
  created_at?: string;
}

interface DBBeneficiary {
  id: string;
  name: string;
  dni: string;
  date: string;
  created_at: string;
}

interface DBBeneficiaryPrize extends DBBeneficiary {
  prize: string;
}

const prizes = [
  { option: "S/ 50.00 SOLES DE DESCUENTO ADICIONAL", number: 1 },
  { option: "S/ 150.00 SOLES DSC EN TU PROXIMO CURSO", number: 2 },
  { option: "VUELVE A GIRAR", number: 3 },
  { option: "ENVIO DE CERTIFICADO GRATUITO", number: 4 },
  { option: "S/ 30 DCS EN TU CERTIFICADO ACREDITADO", number: 5 },
  { option: "ACCESO A UN AÑO EN EL AULA VIRTUAL", number: 6 },
  { option: "PERDISTES", number: 7 },
  { option: "ACCESO A UN AÑO EN EL AULA VIRTUAL", number: 8 },
  { option: "1 CURSO DE REGALO ADICIONAL CON CERTIFICADO DIGITAL", number: 9 },
];

const Index = () => {
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<DisplayBeneficiary[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [currentBeneficiary, setCurrentBeneficiary] =
    useState<DisplayBeneficiary | null>(null);
  const [lastWinner, setLastWinner] = useState<DisplayBeneficiary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      const { data: prizeData, error: prizeError } = await supabase
        .from("beneficiary_prizes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (prizeError) throw prizeError;

      const { data: beneficiaryData, error: beneficiaryError } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (beneficiaryError) throw beneficiaryError;

      if (beneficiaryData) {
        const displayBeneficiaries = beneficiaryData.map(
          (b: DBBeneficiary) => ({
            ...b,
            prize:
              prizeData && prizeData[0]?.dni === b.dni
                ? prizeData[0].prize
                : undefined,
          })
        );
        setBeneficiaries(displayBeneficiaries);

        if (prizeData && prizeData.length > 0) {
          setLastWinner(prizeData[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      toast({
        title: "Error",
        description: "Error al cargar los beneficiarios",
        variant: "destructive",
      });
    }
  };

  const checkExistingDNI = async (dni: string) => {
    try {
      // Check both tables for existing DNI
      const [beneficiaryResult, prizeResult] = await Promise.all([
        supabase
          .from("beneficiaries")
          .select("dni")
          .eq("dni", dni)
          .maybeSingle(),
        supabase
          .from("beneficiary_prizes")
          .select("dni")
          .eq("dni", dni)
          .maybeSingle(),
      ]);

      if (beneficiaryResult.error) throw beneficiaryResult.error;
      if (prizeResult.error) throw prizeResult.error;

      return beneficiaryResult.data !== null || prizeResult.data !== null;
    } catch (error) {
      console.error("Error checking DNI:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!name || !dni) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const exists = await checkExistingDNI(dni);
      if (exists) {
        toast({
          title: "Error",
          description: "Este DNI ya ha sido registrado",
          variant: "destructive",
        });
        return;
      }

      const newBeneficiary: DisplayBeneficiary = {
        name: name.trim(),
        dni: dni.trim(),
        date: format(new Date(), "dd/MM/yyyy"),
      };

      setCurrentBeneficiary(newBeneficiary);
      const newPrizeNumber = Math.floor(Math.random() * prizes.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Error al procesar el registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveBeneficiary = async (beneficiary: DisplayBeneficiary) => {
    try {
      // Insert into both tables
      const beneficiaryData = {
        name: beneficiary.name,
        dni: beneficiary.dni,
        date: beneficiary.date,
      };

      const prizeBeneficiaryData = {
        ...beneficiaryData,
        prize: beneficiary.prize!,
      };

      const [{ error: beneficiaryError }, { error: prizeError }] =
        await Promise.all([
          supabase.from("beneficiaries").insert([beneficiaryData]),
          supabase.from("beneficiary_prizes").insert([prizeBeneficiaryData]),
        ]);

      if (beneficiaryError) throw beneficiaryError;
      if (prizeError) throw prizeError;

      await fetchBeneficiaries();
      return true;
    } catch (error) {
      console.error("Error saving beneficiary:", error);
      throw error;
    }
  };

  const handleStopSpinning = async () => {
    setMustSpin(false);
    if (!currentBeneficiary) return;

    try {
      const beneficiaryWithPrize = {
        ...currentBeneficiary,
        prize: prizes[prizeNumber].option,
      };

      await saveBeneficiary(beneficiaryWithPrize);
      setLastWinner(beneficiaryWithPrize);

      toast({
        title: "¡Felicitaciones!",
        description: `Has ganado: ${prizes[prizeNumber].option}`,
        variant: "default",
      });

      setName("");
      setDni("");
      setCurrentBeneficiary(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el beneficiario",
        variant: "destructive",
      });
    }
  };
  
  const colors = [
    "#cc3c3c", // Rojo
    "#d79748", // Naranja
    "#e2e66b", // Amarillo
    "#78e762", // Verde
    "#54d1dc", // Azul
    "#77a5ef", // Índigo
    "#6b56e0", // Violeta
    "#8B5CF6", // Violeta Intenso (nuevo)
    "#F97316", // Naranja Brillante (nuevo)
  ];
  
  const data = prizes.map((prize, index) => ({
    option: prize.number.toString(),
    backgroundColor: colors[index % colors.length],
    style: { fontSize: 24, fontWeight: "bold" },
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Removed the Ver Ganadores button here */}
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass rounded-xl p-6 space-y-6 h-fit ">
          <h2 className="text-2xl font-bold text-center mb-6 text-white  ">
            Registro de Beneficiario
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="">
                Nombre completo
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/50"
                placeholder="Ingrese nombre completo"
                disabled={isSubmitting || mustSpin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni" className="">
                DNI
              </Label>
              <Input
                id="dni"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="bg-white/50"
                placeholder="Ingrese DNI"
                maxLength={8}
                disabled={isSubmitting || mustSpin}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || mustSpin}
            >
              {isSubmitting ? "Procesando..." : "Registrar y Girar"}
            </Button>
          </form>

          {lastWinner && (
            <div className="mt-6 p-6 bg-white/30 backdrop-blur-md rounded-lg border border-white/20 shadow-xl animate-fade-in">
              <h3 className="font-bold text-xl mb-3 text-white">¡Último Ganador!</h3>
              <div className="space-y-2">
                <p className="text-white"><span className="font-semibold">Nombre:</span> {lastWinner.name}</p>
                <p className="text-white"><span className="font-semibold">DNI:</span> {lastWinner.dni}</p>
                <p className="text-white"><span className="font-semibold">Fecha:</span> {lastWinner.date}</p>
                <div className="mt-4 py-3 px-4 bg-primary/30 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-white text-center">
                    {lastWinner.prize}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 items-center justify-center mx-auto">
            <img
              src="https://pub-9d2abfa175714e64aed33b90722a9fd5.r2.dev/Multimedia/Imagen/Ccd/Logos/acreditacion-cdidp-white.svg"
              alt="Centro de Capacitación y Desarrollo"
              className="w-[9rem] transform transition-transform duration-300 group-hover:scale-110"
            />
            <img
              src="https://pub-9d2abfa175714e64aed33b90722a9fd5.r2.dev/Multimedia/Imagen/Ccd/Logos/acreditacion-pmi-white.svg"
              alt="Centro de Capacitación y Desarrollo"
              className="w-[9rem] transform transition-transform duration-300 group-hover:scale-110"
            />
            <img
              src="https://pub-9d2abfa175714e64aed33b90722a9fd5.r2.dev/Multimedia/Imagen/Ccd/Logos/acreditacion-cdd-white5.svg"
              alt="Centro de Capacitación y Desarrollo"
              className="w-[20rem] transform transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col items-center justify-center text-black">
          <div className="mb-6">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={data}
              onStopSpinning={handleStopSpinning}
              textColors={["#000000"]}
              backgroundColors={colors}
              outerBorderColor="#000000"
              radiusLineColor="#000000"
              radiusLineWidth={4}
              fontSize={24}
            />
          </div>
          <div className="w-full max-w-md mt-6 ">
            <h3 className="text-xl font-bold mb-4">Premios:</h3>
            <ul className="space-y-2">
              {prizes.map((prize, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg "
                  style={{ backgroundColor: colors[index] }} 
                >
                  <span className="font-bold text-lg">{prize.number}.</span>
                  <span>{prize.option}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
