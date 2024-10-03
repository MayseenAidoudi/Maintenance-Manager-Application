import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged: () => void;
  onDatabaseChanged: () => void;
}



const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onSettingsChanged, onDatabaseChanged }) => {
  const [config, setConfig] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    const loadedConfig = await window.api.getConfig();
    setConfig(loadedConfig);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const success = await window.api.setConfig(config);
    if (success) {
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      });
      onSettingsChanged();
      onDatabaseChanged();
      onClose();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  const handleBrowseDatabase = async () => {
    const path = await window.api.openFileDialog();
    if (path) {
      setConfig({ ...config, databasePath: path });
    }
  };

  const handleBrowseUploadFolder = async () => {
    const path = await window.api.openFolderDialog();
    if (path) {
      setConfig({ ...config, uploadFolderPath: path });
    }
  };

  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Modify your application settings here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">

          {/* Database Path */}
          <div className="space-y-2">
            <label htmlFor="databasePath">Database Path</label>
            <div className="flex space-x-2 mb-2">
              <Input
                id="databasePath"
                name="databasePath"
                value={config.databasePath || ''}
                onChange={handleChange}
                readOnly
              />
              <Button onClick={handleBrowseDatabase}>Browse</Button>
            </div>
            <div className='py-1'>
              <label className='font-thin font-sm'>Note: It is normal for the file path to begin with "\\DeviceName\" if the file chosen is on a network drive</label>
            </div>
          </div>

          {/* Upload Folder Path */}
          <div className="space-y-2">
            <label htmlFor="uploadFolderPath">Upload Folder Path</label>
            <div className="flex space-x-2 mb-2">
              <Input
                id="uploadFolderPath"
                name="uploadFolderPath"
                value={config.uploadFolderPath || ''}
                onChange={handleChange}
                readOnly
              />
              <Button onClick={handleBrowseUploadFolder}>Browse</Button>
            </div>
          </div>
          <label className='font-thin font-sm'>Email Settings, Default settings are compatible with Marquardt-tn SMTP Servers, Do not modify unless needed</label>

          <div className='grid grid-cols-2 gap-4'>
            {/* Email Settings */}
            <div className="space-y-2">
              <label htmlFor="smtpServer">SMTP Server</label>
              <Input
                id="smtpServer"
                name="smtpServer"
                value={config.smtpServer || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="smtpPort">SMTP Port</label>
              <Input
                id="smtpPort"
                name="smtpPort"
                type="number"
                value={config.smtpPort || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className="space-y-2">
              <label htmlFor="smtpUsername">SMTP Username</label>
              <Input
                id="smtpUsername"
                name="smtpUsername"
                value={config.smtpUsername || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="smtpPassword">SMTP Password</label>
              <Input
                id="smtpPassword"
                name="smtpPassword"
                type="password"
                value={config.smtpPassword || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
          <div className="space-y-2">
            <label htmlFor="smtpSecure">Use Secure Connection (SSL/TLS)</label>
            <div className="flex items-center">
              <Checkbox
                id="smtpSecure"
                name="smtpSecure"
                checked={config.smtpSecure || false}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, smtpSecure: checked })
                }
              />
              <span className="ml-2">Enable</span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="smtpTLS">Require TLS auth</label>
            <div className="flex items-center">
              <Checkbox
                id="smtpTLS"
                name="smtpTLS"
                checked={config.smtpTLS || false}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, smtpTLS: checked })
                }
              />
              <span className="ml-2">Enable</span>
            </div>
          </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="emailFrom">Default From Email</label>
            <Input
              id="emailFrom"
              name="emailFrom"
              value={config.emailFrom || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
