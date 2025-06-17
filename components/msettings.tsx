"use client"
import { useState } from 'react';

import { Switch } from '@headlessui/react';

import { updateBannerData } from '@/actions/message';
import { MessageBannerData } from '@/components/message';


interface BannerSettingsFormProps {
  initialData: MessageBannerData | null;
}

interface FormData {
  message: string;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
  showCloseButton: boolean;
}

interface SaveStatus {
  type: 'success' | 'error';
  message: string;
}

export default function BannerSettingsForm({ initialData }: BannerSettingsFormProps) {
  const [formData, setFormData] = useState<FormData>({
    message: initialData?.message || "Welcome to Jax",
    isActive: initialData?.isActive || false,
    backgroundColor: initialData?.backgroundColor || "#3B82F6",
    textColor: initialData?.textColor || "#FFFFFF",
    showCloseButton: initialData?.showCloseButton || true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const result = await updateBannerData(formData);
      if (result.success) {
        setSaveStatus({ type: 'success', message: 'Banner settings saved successfully!' });
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save banner settings.' });
      }
    } catch (error) {
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'An error occurred' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSwitch = (field: keyof FormData, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
       <h2 className="text-2xl font-bold mb-6">Message Banner Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Active Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Enable Banner</label>
          <Switch
            checked={formData.isActive}
            onChange={(checked) => toggleSwitch('isActive', checked)}
            className={`${
              formData.isActive ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
        
        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Banner Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        {/* Color Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="backgroundColor"
                name="backgroundColor"
                value={formData.backgroundColor}
                onChange={handleChange}
                className="h-10 w-10 border-0 rounded p-0"
              />
              <input
                type="text"
                value={formData.backgroundColor}
                onChange={handleChange}
                name="backgroundColor"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="textColor"
                name="textColor"
                value={formData.textColor}
                onChange={handleChange}
                className="h-10 w-10 border-0 rounded p-0"
              />
              <input
                type="text"
                value={formData.textColor}
                onChange={handleChange}
                name="textColor"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Close Button Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Show Close Button</label>
          <Switch
            checked={formData.showCloseButton}
            onChange={(checked) => toggleSwitch('showCloseButton', checked)}
            className={`${
              formData.showCloseButton ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                formData.showCloseButton ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
        
        {/* Preview */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
          <div 
            className="p-3 rounded-md"
            style={{ 
              backgroundColor: formData.backgroundColor,
              color: formData.textColor
            }}
          >
            <p>{formData.message}</p>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        
        {/* Status Message */}
        {saveStatus && (
          <div className={`mt-4 p-3 rounded-md ${
            saveStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {saveStatus.message}
          </div>
        )}
      </form>
    </div>
  );
}
