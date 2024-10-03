export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
}


export function addMachineIdPrefix(machineId: number, fileName: string): string {
    return `${machineId}_${fileName}`;
}

export function removeMachineIdPrefix(fileName: string): string {
    return fileName.split('_').slice(1).join('_');
}

export function hasMachineIdPrefix(machineId: number, fileName: string): boolean {
    return fileName.startsWith(`${machineId}_`);
}