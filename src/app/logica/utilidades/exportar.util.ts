import { format } from 'date-fns';
import { EntradaPdf } from '../modelos/pedidos';

// Lo que se baja o se imprime: el PDF de la entrada y el Excel y el PDF de los reportes

// Escribe un texto (en varios renglones si no entra) y devuelve dónde sigue. Todo en mm
function escribir(pdf: import('jspdf').jsPDF, texto: string, y: number, tamano: number, negrita: boolean) {
  pdf.setFont('helvetica', negrita ? 'bold' : 'normal');
  pdf.setFontSize(tamano);
  const renglones = pdf.splitTextToSize(texto, 85);
  pdf.text(renglones, 10, y);
  return y + renglones.length * tamano * 0.42 + 2.5;
}

// Profe, puedo usar jspdf y qrcode? qrcode arma la imagen del QR y jsPDF arma el .pdf y lo baja.
// Se cargan recién al tocar el botón, con import()
export async function descargarEntradaPdf(entrada: EntradaPdf) {
  const { jsPDF } = await import('jspdf');
  const qrcode = await import('qrcode');
  const qr = await qrcode.toDataURL(entrada.codigo, { width: 400, margin: 1 });

  // 105 mm de ancho como una entrada. compress: si no, el PDF pesa medio mega
  const pdf = new jsPDF({ format: [105, 180], compress: true });
  let y = escribir(pdf, 'allomund · Entrada', 14, 12, true);
  y = escribir(pdf, entrada.pelicula, y + 2, 17, true);
  y = escribir(pdf, `${format(new Date(entrada.inicio), 'dd/MM/yyyy HH:mm')} · ${entrada.sala}`, y, 11, false);
  y = escribir(pdf, 'Butacas: ' + entrada.butacas.join(', '), y, 11, false);
  if (entrada.candy.length) y = escribir(pdf, 'Candy: ' + entrada.candy.join(', '), y, 11, false);
  // la misma aclaración que en la ficha de la película
  if (entrada.restriccionEdad) {
    pdf.setTextColor(200, 16, 46);
    y = escribir(pdf, `Película apta para mayores de ${entrada.restriccionEdad} años. Debe ir acompañado de un adulto.`, y + 1, 10, true);
    pdf.setTextColor(0, 0, 0);
  }

  // el QR centrado, con el código abajo por si hay que escribirlo a mano
  pdf.addImage(qr, 'PNG', 25, y + 4, 55, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(entrada.codigo, 52.5, y + 67, { align: 'center' });
  pdf.setTextColor(110, 110, 110);
  escribir(pdf, 'Mostrá este QR en la entrada de la sala y en el candy bar. Sirve una sola vez para cada cosa.', y + 76, 9, false);

  pdf.save(`entrada-${entrada.codigo}.pdf`);
}

// xlsx (SheetJS): cada objeto es una fila y sus nombres son los títulos. También se carga recién al usarla
export async function descargarExcel(filas: object[], hoja: string, archivo: string) {
  const { utils, writeFile } = await import('xlsx');
  const libro = utils.book_new();
  utils.book_append_sheet(libro, utils.json_to_sheet(filas), hoja);
  writeFile(libro, archivo);
}

// Profe, puedo usar window.open() y print()? abro una ventana con la tabla y el navegador la imprime
// ("Guardar como PDF"). Devuelve false si el navegador no dejó abrir la ventana
export function imprimirPdf(titulo: string, contenido: string) {
  const ventana = window.open('', '_blank');
  if (!ventana) return false;
  ventana.document.title = titulo;
  ventana.document.body.innerHTML = `
    <style>
      body { font-family: sans-serif; padding: 24px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px 10px; border-bottom: 1px solid #ccc; text-align: left; }
      tfoot th { border-top: 2px solid #000; }
    </style>
    ${contenido}`;
  ventana.print();
  return true;
}
