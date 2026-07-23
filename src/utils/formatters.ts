export function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function formatCPF(cpf: string): string {
  if (cpf.length === 11) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  }
  return cpf;
}

export function formatCNPJ(cnpj: string): string {
  if (cnpj.length === 14) {
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
  }
  return cnpj;
}

export function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  }
  return phone;
}

export function formatDocument(doc: string): string {
  return doc.length <= 11 ? formatCPF(doc) : formatCNPJ(doc);
}
