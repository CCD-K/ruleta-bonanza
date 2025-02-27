
import { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Define interfaces that match our current usage without conflicting with Supabase types
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

const prizes = [
  { option: "S/ 50.00 SOLES DE DESCUENTO ADICIONAL", number: 1 },
  { option: "S/ 150.00 SOLES DSC EN TU PROXIMO CURSO", number: 2 },
  { option: "1 CURSO DE REGALO ADICIONAL CON CERTIFICADO DIGITAL", number: 3 },
  { option: "ENVIO DE CERTIFICADO GRATUITO", number: 4 },
  { option: "S/ 30 DCS EN TU CERTIFICADO ACREDITADO", number: 5 },
  { option: "ACCESO A UN AÑO EN EL AULA VIRTUAL", number: 6 },
  { option: "2 CURSOS DE REGALO (NO INCLUYE CERTIFICADO)", number: 7 },
];

const Index = () => {
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<DisplayBeneficiary[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [currentBeneficiary, setCurrentBeneficiary] = useState<DisplayBeneficiary | null>(null);
  const [lastWinner, setLastWinner] = useState<DisplayBeneficiary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Convert DB beneficiaries to display beneficiaries
        const displayBeneficiaries = data.map((b: DBBeneficiary) => ({
          ...b,
          prize: lastWinner?.prize // Only the last winner will have a prize in memory
        }));
        setBeneficiaries(displayBeneficiaries);
        if (displayBeneficiaries.length > 0) {
          setLastWinner(displayBeneficiaries[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      toast({
        title: "Error",
        description: "Error al cargar los beneficiarios",
        variant: "destructive",
      });
    }
  };

  const checkExistingDNI = async (dni: string) => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('dni')
        .eq('dni', dni)
        .maybeSingle();

      if (error) throw error;
      return data !== null;
    } catch (error) {
      console.error('Error checking DNI:', error);
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
      console.error('Error submitting form:', error);
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
      // Only save the beneficiary data without the prize
      const { prize, ...beneficiaryData } = beneficiary;
      
      const { error } = await supabase
        .from('beneficiaries')
        .insert([beneficiaryData]);

      if (error) throw error;
      
      await fetchBeneficiaries();
      return true;
    } catch (error) {
      console.error('Error saving beneficiary:', error);
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

  const data = prizes.map((prize) => ({
    option: prize.number.toString(),
    style: { fontSize: 24, fontWeight: "bold" }
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass rounded-xl p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center mb-6">Registro de Beneficiario</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
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
              <Label htmlFor="dni">DNI</Label>
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
            <div className="mt-6 p-4 bg-white/30 rounded-lg">
              <h3 className="font-semibold mb-2">Último Ganador:</h3>
              <p>Nombre: {lastWinner.name}</p>
              <p>DNI: {lastWinner.dni}</p>
              <p>Fecha: {lastWinner.date}</p>
              <p className="mt-2 font-bold text-primary">Premio: {lastWinner.prize}</p>
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6 flex flex-col items-center justify-center">
          <div className="mb-6">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={data}
              onStopSpinning={handleStopSpinning}
              textColors={["#000000"]}
              backgroundColors={["#ffffff"]}
              outerBorderColor="#dddddd"
              radiusLineColor="#dddddd"
              radiusLineWidth={1}
              fontSize={24}
            />
          </div>
          <div className="w-full max-w-md mt-6">
            <h3 className="text-xl font-bold mb-4">Premios:</h3>
            <ul className="space-y-2">
              {prizes.map((prize, index) => (
                <li key={index} className="flex items-center gap-2 bg-white/30 p-3 rounded-lg">
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
