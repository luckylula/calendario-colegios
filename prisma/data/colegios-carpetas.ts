/**
 * Lista real de colegios — nombres tomados de las subcarpetas de Drive oficina.
 * Carpeta padre: https://drive.google.com/drive/folders/0B3NBmVGQogB-cHZMTS1kcGZDTlU
 *
 * nombreCarpetaDrive = prefijo de la carpeta en Drive (sin el sufijo de curs 25-26).
 * n8n empareja carpetes que comencen per aquest text.
 */

export interface ColegioCarpetasData {
  nombre: string;
  nombreCarpetaDrive: string;
  googleDriveFolderId: string;
  onedriveFolderId: string;
  googleDriveOutputFolderId: string | null;
}

export const COLEGIOS_CARPETAS: ColegioCarpetasData[] = [
  {
    nombre: "Dolors Almeda",
    nombreCarpetaDrive: "DOLORS ALMEDA",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Els Pins",
    nombreCarpetaDrive: "ELS PINS",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Ernest Lluch",
    nombreCarpetaDrive: "ERNEST LLUCH",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Espai 3",
    nombreCarpetaDrive: "ESPAI 3",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Francesc Platón",
    nombreCarpetaDrive: "FRANCESC PLATON",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Frederic Mistral",
    nombreCarpetaDrive: "FREDERIC MISTRAL",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "IE Torrelles",
    nombreCarpetaDrive: "IETORRELLES",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Immaculada Extraescolars",
    nombreCarpetaDrive: "IMMACULADA EXTRAESCOLARS",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Iris",
    nombreCarpetaDrive: "IRIS",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Juncadella Extraescolars",
    nombreCarpetaDrive: "JUNCADELLA EXTRAESCOLARS CURS",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "La Vinyala Extraescolars",
    nombreCarpetaDrive: "LA VINYALA EXTRAESCOLARS",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Marianao",
    nombreCarpetaDrive: "MARIANAO",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Marta Mata",
    nombreCarpetaDrive: "MARTA MATA",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Sant Antoni",
    nombreCarpetaDrive: "SANT ANTONI",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
  {
    nombre: "Vicente Ferrer",
    nombreCarpetaDrive: "VICENTE FERRER",
    googleDriveFolderId: "",
    onedriveFolderId: "",
    googleDriveOutputFolderId: null,
  },
];
