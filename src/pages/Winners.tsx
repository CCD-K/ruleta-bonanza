
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Winner {
  id: string;
  name: string;
  dni: string;
  date: string;
  prize: string;
  created_at: string;
}

const Winners = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("beneficiary_prizes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setWinners(data as Winner[]);
      }
    } catch (error) {
      console.error("Error fetching winners:", error);
      toast({
        title: "Error",
        description: "Error al cargar la lista de ganadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Lista de Ganadores</h1>
          <Link to="/">
            <Button>Volver a Inicio</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-white text-center py-4">Cargando ganadores...</p>
        ) : winners.length === 0 ? (
          <p className="text-white text-center py-4">No hay ganadores registrados aún</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {winners.map((winner) => (
              <Card key={winner.id} className="bg-white/20 backdrop-blur-sm border-none hover:bg-white/30 transition">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{winner.name}</CardTitle>
                  <p className="text-sm text-gray-200">DNI: {winner.dni}</p>
                  <p className="text-sm text-gray-200">Fecha: {winner.date}</p>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <h3 className="font-semibold text-white mb-1">Premio:</h3>
                    <p className="text-white">{winner.prize}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
  );
};

export default Winners;
