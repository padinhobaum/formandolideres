import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  call_number: number | null;
  class_name: string;
  guardian_contact: string | null;
  notes: string | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.
      from("students").
      select("*").
      order("class_name").
      order("call_number");
      if (data) setStudents(data);
    };
    fetchStudents();
  }, []);

  const classes = [...new Set(students.map((s) => s.class_name))].sort();

  const filtered = students.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !classFilter || s.class_name === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <h2 className="font-heading font-bold mb-6 text-4xl text-accent">Informações dos Alunos</h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Pesquisar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9" />
            
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border bg-card px-3 py-2 text-sm font-body rounded">
            
            <option value="">Todas as turmas</option>
            {classes.map((c) =>
            <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>

        {filtered.length === 0 ?
        <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p> :

        <div className="space-y-1">
            {filtered.map((student) => {
            const isExpanded = expandedId === student.id;
            return (
              <div key={student.id} className="border bg-card">
                  <button
                  onClick={() => setExpandedId(isExpanded ? null : student.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary transition-colors">
                  
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-8 text-center font-body">
                        {student.call_number ?? "—"}
                      </span>
                      <span className="font-body text-sm font-medium">{student.full_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{student.class_name}</span>
                      {isExpanded ?
                    <ChevronUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /> :

                    <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    }
                    </div>
                  </button>
                  {isExpanded &&
                <div className="px-4 pb-4 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Turma</p>
                          <p className="text-sm font-body">{student.class_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Nº Chamada</p>
                          <p className="text-sm font-body">{student.call_number ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Contato do Responsável</p>
                          <p className="text-sm font-body">{student.guardian_contact || "Não informado"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs text-muted-foreground mb-1">Observações</p>
                          <p className="text-sm font-body">{student.notes || "Nenhuma observação."}</p>
                        </div>
                      </div>
                    </div>
                }
                </div>);

          })}
          </div>
        }
      </div>
    </AppLayout>);

}