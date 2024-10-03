import React, { useState, useEffect } from 'react';
import { Button } from "@renderer/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog";
import QRCode from 'qrcode';

const QRCodeGenerator = ({ text,machineName,machineSAP, isOpen, onClose }) => {
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    if (text) {
      generateQRCode(text);
    }
  }, [text]);

  const generateQRCode = async (text) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(text, {
        type: 'png', // Generate PNG format
        margin: 4, // Quiet zone margin (you can adjust as needed)
      });
      setQrCode(qrDataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const saveQRCode = () => {
    if (qrCode) {
      // Convert base64 to binary
      const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode_${machineName}_${machineSAP}_CheckLists.png`; // Filename with timestamp for uniqueness
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-auto">
        <DialogHeader>
          <DialogTitle>QR Code For Checklists</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {qrCode && (
            <div className="flex flex-col items-center mt-4">
              <img src={qrCode} alt="QR Code" className="w-200 h-200" />
              <div className="flex mt-4">
                <Button onClick={saveQRCode} className="mr-2">Save</Button>
                <Button onClick={onClose}>Close</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;
