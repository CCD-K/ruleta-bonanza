
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Search, Download, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Winner {
  id: string;
  name: string;
  dni: string;
  phone_number?: string;
  date: string;
  prize: string;
  created_at: string;
}

const Winners = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [filteredWinners, setFilteredWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDni, setSearchDni] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    fetchWinners();
  }, []);

  useEffect(() => {
    filterWinners();
  }, [searchDni, winners, startDate, endDate]);

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
        setFilteredWinners(data as Winner[]);
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

  const filterWinners = () => {
    let filtered = [...winners];
    
    // Filter by DNI
    if (searchDni.trim() !== '') {
      filtered = filtered.filter(winner => 
        winner.dni.includes(searchDni.trim())
      );
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(winner => {
        const winnerDate = new Date(winner.created_at);
        return winnerDate >= start && winnerDate <= end;
      });
    }
    
    setFilteredWinners(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchDni(e.target.value);
  };

  const handleExportToExcel = () => {
    // Create worksheet from filtered data
    const worksheet = XLSX.utils.json_to_sheet(
      filteredWinners.map((winner) => ({
        Nombre: winner.name,
        DNI: winner.dni,
        Celular: winner.phone_number || "No disponible",
        Fecha: winner.date,
        Premio: winner.prize,
        "Fecha de registro": new Date(winner.created_at).toLocaleString(),
      }))
    );

    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ganadores");

    // Generate file name with current date
    const fileName = `Ganadores_${format(new Date(), "dd-MM-yyyy")}.xlsx`;

    // Export to file
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Éxito",
      description: "Lista de ganadores exportada a Excel",
    });
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-auto">
            <div className="flex items-center max-w-sm">
              <Input
                type="text"
                placeholder="Buscar por DNI"
                value={searchDni}
                onChange={handleSearchChange}
                className="bg-white/20 text-white border-none placeholder:text-gray-300 pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white h-5 w-5" />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-white/20 text-white border-none">
                    <Calendar className="h-4 w-4 mr-2" />
                    {startDate && endDate
                      ? `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
                      : "Filtrar por fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Fecha inicio</h4>
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Fecha fin</h4>
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button size="sm" variant="outline" onClick={clearDateFilter}>
                        Limpiar
                      </Button>
                      <Button size="sm" onClick={() => filterWinners()}>
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button 
                onClick={handleExportToExcel} 
                disabled={filteredWinners.length === 0} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar a Excel
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-white text-center py-4">Cargando ganadores...</p>
        ) : filteredWinners.length === 0 ? (
          <p className="text-white text-center py-4">
            {searchDni.trim() || (startDate && endDate) 
              ? "No se encontraron ganadores con los filtros seleccionados" 
              : "No hay ganadores registrados aún"}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWinners.map((winner) => (
              <Card key={winner.id} className="bg-blue-40 backdrop-blur-sm border-none hover:bg-blue-20/30 transition">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{winner.name}</CardTitle>
                  <p className="text-sm text-gray-200">DNI: {winner.dni}</p>
                  {winner.phone_number && (
                    <p className="text-sm text-gray-200">Celular: {winner.phone_number}</p>
                  )}
                  <p className="text-sm text-gray-200">Fecha: {winner.date}</p>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary 40/10 p-3 rounded-lg">
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
