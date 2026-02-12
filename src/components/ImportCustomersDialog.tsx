import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { apiPost } from '@/integrations/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

type SystemField = 'name' | 'cpf_cnpj' | 'main_contact_name' | 'phone' | 'email' | 'street' | 'number' | 'city' | 'state' | 'zip';

const FIELD_LABELS: Record<SystemField, string> = {
  name: 'Nome / Razão Social',
  cpf_cnpj: 'CPF / CNPJ',
  main_contact_name: 'Contato Principal',
  phone: 'Telefone',
  email: 'E-mail',
  street: 'Rua',
  number: 'Número',
  city: 'Cidade',
  state: 'Estado',
  zip: 'CEP',
};

const CUSTOMER_FIELDS: SystemField[] = ['name', 'cpf_cnpj', 'main_contact_name', 'phone', 'email'];
const ADDRESS_FIELDS: SystemField[] = ['street', 'number', 'city', 'state', 'zip'];
const ALL_FIELDS: SystemField[] = [...CUSTOMER_FIELDS, ...ADDRESS_FIELDS];

const AUTO_MAP: Record<string, SystemField> = {
  nome: 'name', 'razao social': 'name', 'razão social': 'name', name: 'name', company: 'name', empresa: 'name', cliente: 'name',
  cpf: 'cpf_cnpj', cnpj: 'cpf_cnpj', 'cpf/cnpj': 'cpf_cnpj', 'cpf_cnpj': 'cpf_cnpj', documento: 'cpf_cnpj',
  contato: 'main_contact_name', 'contato principal': 'main_contact_name', contact: 'main_contact_name', responsavel: 'main_contact_name', 'responsável': 'main_contact_name',
  telefone: 'phone', phone: 'phone', celular: 'phone', tel: 'phone', fone: 'phone', whatsapp: 'phone',
  email: 'email', 'e-mail': 'email', mail: 'email',
  rua: 'street', logradouro: 'street', 'endereço': 'street', endereco: 'street', street: 'street', address: 'street',
  numero: 'number', 'número': 'number', num: 'number', 'nº': 'number', number: 'number',
  cidade: 'city', city: 'city', municipio: 'city', 'município': 'city',
  estado: 'state', uf: 'state', state: 'state',
  cep: 'zip', zip: 'zip', 'codigo postal': 'zip', 'código postal': 'zip',
};

function autoDetect(columns: string[]): Record<string, SystemField | ''> {
  const mapping: Record<string, SystemField | ''> = {};
  const used = new Set<SystemField>();
  for (const col of columns) {
    const key = col.trim().toLowerCase();
    const match = AUTO_MAP[key];
    if (match && !used.has(match)) {
      mapping[col] = match;
      used.add(match);
    } else {
      mapping[col] = '';
    }
  }
  return mapping;
}

type Step = 'upload' | 'mapping' | 'preview';

interface ImportCustomersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const MAX_ROWS = 500;

const ImportCustomersDialog: React.FC<ImportCustomersDialogProps> = ({ open, onOpenChange }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, SystemField | ''>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setColumns([]);
    setRows([]);
    setMapping({});
    setImporting(false);
    setProgress(0);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

        if (json.length === 0) {
          toast({ title: 'Planilha vazia', description: 'Nenhuma linha encontrada.', variant: 'destructive' });
          return;
        }

        const cols = Object.keys(json[0]);
        const limited = json.slice(0, MAX_ROWS).map(row =>
          Object.fromEntries(cols.map(c => [c, String(row[c] ?? '').trim()]))
        );

        setFileName(file.name);
        setColumns(cols);
        setRows(limited);
        setMapping(autoDetect(cols));
        setStep('mapping');

        if (json.length > MAX_ROWS) {
          toast({ title: `Limitado a ${MAX_ROWS} linhas`, description: `A planilha tem ${json.length} linhas. Apenas as primeiras ${MAX_ROWS} serão importadas.` });
        }
      } catch {
        toast({ title: 'Erro ao ler arquivo', description: 'Formato não suportado ou arquivo corrompido.', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const updateMapping = (col: string, value: string) => {
    setMapping(prev => ({ ...prev, [col]: value as SystemField | '' }));
  };

  const nameIsMapped = Object.values(mapping).includes('name');

  const getMappedRows = () => {
    return rows.map(row => {
      const mapped: Record<string, string> = {};
      for (const [col, field] of Object.entries(mapping)) {
        if (field) mapped[field] = row[col] || '';
      }
      return mapped;
    }).filter(r => r.name?.trim());
  };

  const duplicates = (() => {
    const mapped = getMappedRows();
    const seen = new Set<string>();
    const dups = new Set<number>();
    mapped.forEach((r, i) => {
      const key = r.cpf_cnpj?.trim();
      if (key) {
        if (seen.has(key)) dups.add(i);
        else seen.add(key);
      }
    });
    return dups;
  })();

  const validRows = getMappedRows();

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    let success = 0;
    let errors = 0;
    const hasAddress = ADDRESS_FIELDS.some(f => Object.values(mapping).includes(f));

    const batchSize = 50;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);

      try {
        for (const r of batch) {
          const customer = await apiPost<any>('/api/customers', {
            name: r.name.trim(),
            cpf_cnpj: r.cpf_cnpj?.trim() || '',
            main_contact_name: r.main_contact_name?.trim() || '',
            phone: r.phone?.trim() || '',
            email: r.email?.trim() || '',
          });
          if (hasAddress) {
            const street = r.street?.trim();
            const city = r.city?.trim();
            if (street || city) {
              await apiPost(`/api/customers/${customer.id}/addresses`, {
                label: 'Principal',
                street: street || '',
                number: r.number?.trim() || '',
                city: city || '',
                state: r.state?.trim() || '',
                zip: r.zip?.trim() || '',
                is_default: true,
              });
            }
          }
          success += 1;
        }
      } catch {
        errors += batch.length;
      }

      setProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    qc.invalidateQueries({ queryKey: ['customers'] });
    toast({
      title: `Importação concluída`,
      description: `${success} cliente${success !== 1 ? 's' : ''} importado${success !== 1 ? 's' : ''}${errors > 0 ? `, ${errors} erro${errors !== 1 ? 's' : ''}` : ''}.`,
      variant: errors > 0 ? 'destructive' : 'default',
    });
    setImporting(false);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Clientes
            {fileName && <Badge variant="secondary" className="text-xs font-normal">{fileName}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Arraste uma planilha aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">Formatos: CSV, XLS, XLSX • Máx. 500 linhas</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xls,.xlsx,.ods"
              className="hidden"
              onChange={onFileSelect}
            />
          </div>
        )}

        {/* Step: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Mapeie as colunas da planilha para os campos do sistema. Colunas não mapeadas serão ignoradas.
            </p>
            <div className="space-y-2">
              {columns.map(col => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-1/3 truncate" title={col}>{col}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Select value={mapping[col] || '_ignore'} onValueChange={v => updateMapping(col, v === '_ignore' ? '' : v)}>
                    <SelectTrigger className="w-2/3 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_ignore">— Ignorar —</SelectItem>
                      {ALL_FIELDS.map(f => {
                        const alreadyUsed = Object.entries(mapping).some(([c, v]) => v === f && c !== col);
                        return (
                          <SelectItem key={f} value={f} disabled={alreadyUsed}>
                            {FIELD_LABELS[f]}{alreadyUsed ? ' (já mapeado)' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!nameIsMapped && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                O campo "Nome / Razão Social" é obrigatório. Mapeie uma coluna para ele.
              </div>
            )}
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span><strong>{validRows.length}</strong> cliente{validRows.length !== 1 ? 's' : ''} para importar</span>
              {duplicates.size > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  {duplicates.size} duplicata{duplicates.size !== 1 ? 's' : ''} (CPF/CNPJ)
                </Badge>
              )}
              {rows.length - validRows.length > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {rows.length - validRows.length} ignorada{rows.length - validRows.length !== 1 ? 's' : ''} (sem nome)
                </Badge>
              )}
            </div>

            <div className="border rounded-lg overflow-x-auto max-h-60">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-semibold">#</th>
                    {ALL_FIELDS.filter(f => Object.values(mapping).includes(f)).map(f => (
                      <th key={f} className="text-left p-2 font-semibold whitespace-nowrap">{FIELD_LABELS[f]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 10).map((r, i) => (
                    <tr key={i} className={`border-t ${duplicates.has(i) ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      {ALL_FIELDS.filter(f => Object.values(mapping).includes(f)).map(f => (
                        <td key={f} className="p-2 max-w-[150px] truncate">{r[f] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">... e mais {validRows.length - 10} linhas</p>
              )}
            </div>

            {importing && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Importando... {progress}%</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 'upload' && (
            <Button variant="outline" onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')} disabled={importing}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>Cancelar</Button>
          {step === 'mapping' && (
            <Button onClick={() => setStep('preview')} disabled={!nameIsMapped}>
              Pré-visualizar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
              {importing ? 'Importando...' : `Importar ${validRows.length} cliente${validRows.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCustomersDialog;
