import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle,
  Loader,
  Copy,
} from "lucide-react";
import CAMPAIGN_TEMPLATES from "../../content/data/campaignTemplates";
import { campaignsAPI } from "../../services/api";

const CampaignCreator = ({ onCampaignCreated = () => {} }) => {
  const [step, setStep] = useState(1); // 1: Template, 2: Details, 3: Form Fields
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdCampaignId, setCreatedCampaignId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    duration: 14,
    coverImage: "",
    targetAudience: ["All Alumni"],
    specificBatches: [],
    specificDepartments: [],
    formFields: [],
    tags: [],
    allowPublishing: true,
    sendNotifications: true,
  });

  const [newField, setNewField] = useState({
    fieldName: "",
    fieldType: "text",
    label: "",
    placeholder: "",
    required: false,
    options: [],
    maxLength: "",
    minLength: "",
  });

  const [newOption, setNewOption] = useState("");

  // ✅ Select template and populate form
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      category: template.category,
      duration: template.duration,
      formFields: JSON.parse(JSON.stringify(template.formFields)), // Deep copy
    });
    setStep(2);
  };

  // ✅ Start from scratch
  const handleStartFromScratch = () => {
    setSelectedTemplate(null);
    setFormData({
      title: "",
      description: "",
      category: "Other",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      duration: 14,
      coverImage: "",
      targetAudience: ["All Alumni"],
      specificBatches: [],
      specificDepartments: [],
      formFields: [],
      tags: [],
      allowPublishing: true,
      sendNotifications: true,
    });
    setStep(2);
  };

  // ✅ Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-calculate end date based on duration
    if (field === "duration") {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(value));
      setFormData((prev) => ({
        ...prev,
        endDate: endDate.toISOString().split("T")[0],
      }));
    }
  };

  // ✅ Add new form field
  const handleAddField = () => {
    if (!newField.fieldName || !newField.label) {
      setError("Field name and label are required");
      return;
    }

    const field = {
      fieldId: `field-${Date.now()}`,
      fieldName: newField.fieldName,
      fieldType: newField.fieldType,
      label: newField.label,
      placeholder: newField.placeholder,
      required: newField.required,
      options: newField.options,
      maxLength: newField.maxLength ? parseInt(newField.maxLength) : undefined,
      minLength: newField.minLength ? parseInt(newField.minLength) : undefined,
    };

    setFormData((prev) => ({
      ...prev,
      formFields: [...prev.formFields, field],
    }));

    // Reset new field form
    setNewField({
      fieldName: "",
      fieldType: "text",
      label: "",
      placeholder: "",
      required: false,
      options: [],
      maxLength: "",
      minLength: "",
    });

    setError(null);
  };

  // ✅ Remove form field
  const handleRemoveField = (fieldId) => {
    setFormData((prev) => ({
      ...prev,
      formFields: prev.formFields.filter((f) => f.fieldId !== fieldId),
    }));
  };

  // ✅ Add option to select/radio/checkbox field
  const handleAddOption = () => {
    if (!newOption.trim()) {
      setError("Option cannot be empty");
      return;
    }

    setNewField((prev) => ({
      ...prev,
      options: [...prev.options, newOption.trim()],
    }));
    setNewOption("");
    setError(null);
  };

  // ✅ Remove option
  const handleRemoveOption = (index) => {
    setNewField((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // ✅ Create campaign
  const handleCreateCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ Validation
      if (!formData.title || !formData.description || !formData.category) {
        setError("Title, description, and category are required");
        setIsLoading(false);
        return;
      }

      if (formData.formFields.length === 0) {
        setError("At least one form field is required");
        setIsLoading(false);
        return;
      }

      // ✅ Prepare payload
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        duration: formData.duration,
        coverImage: formData.coverImage || null,
        targetAudience: formData.targetAudience,
        specificBatches: formData.specificBatches,
        specificDepartments: formData.specificDepartments,
        formFields: formData.formFields,
        tags: formData.tags,
        allowPublishing: formData.allowPublishing,
        sendNotifications: formData.sendNotifications,
        status: "Draft",
      };

      console.log("📤 Creating campaign with payload:", payload);

      const response = await campaignsAPI.create(payload);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to create campaign");
      }

      // ✅ Success
      console.log("✅ Campaign created:", data.campaign);
      setCreatedCampaignId(data.campaign._id);
      setSuccess(`Campaign created successfully! ID: ${data.campaign._id}`);

      // ✅ Callback to parent
      onCampaignCreated(data.campaign);

      // ✅ Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          title: "",
          description: "",
          category: "Other",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          duration: 14,
          coverImage: "",
          targetAudience: ["All Alumni"],
          specificBatches: [],
          specificDepartments: [],
          formFields: [],
          tags: [],
          allowPublishing: true,
          sendNotifications: true,
        });
        setStep(1);
        setSelectedTemplate(null);
        setCreatedCampaignId(null);
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("❌ Error creating campaign:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Copy campaign ID
  const handleCopyCampaignId = () => {
    navigator.clipboard.writeText(createdCampaignId);
    setSuccess("Campaign ID copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* STEP 1: SELECT TEMPLATE */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Create New Campaign
            </h2>
            <p className="text-slate-600">
              Choose a template or start from scratch
            </p>
          </div>

          {/* Error & Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Start from Scratch */}
          <motion.button
            onClick={handleStartFromScratch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-6 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                <Plus size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Start from Scratch
                </h3>
                <p className="text-slate-600 text-sm">
                  Create a custom campaign with your own form fields
                </p>
              </div>
            </div>
          </motion.button>

          {/* Templates Grid */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Or choose a template
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(CAMPAIGN_TEMPLATES).map((template) => (
                <motion.button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition text-left"
                >
                  <h4 className="font-bold text-slate-900 mb-1">
                    {template.title}
                  </h4>
                  <p className="text-slate-600 text-sm mb-3">
                    {template.description}
                  </p>
                  <div className="text-xs text-slate-500 flex gap-2">
                    <span className="px-2 py-1 bg-slate-100 rounded">
                      {template.duration} days
                    </span>
                    <span className="px-2 py-1 bg-slate-100 rounded">
                      {template.formFields.length} fields
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: CAMPAIGN DETAILS */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Campaign Details
            </h2>
            <p className="text-slate-600">
              {selectedTemplate
                ? `Template: ${selectedTemplate.title}`
                : "Custom Campaign"}
            </p>
          </div>

          {/* Error & Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Campaign Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter campaign title"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your campaign"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select category</option>
                <option value="Nostalgic Stories">Nostalgic Stories</option>
                <option value="Alumni in Spotlight">Alumni in Spotlight</option>
                <option value="Entrepreneur Stories">
                  Entrepreneur Stories
                </option>
                <option value="Awards & Recognition">
                  Awards & Recognition
                </option>
                <option value="Placement Drive">Placement Drive</option>
                <option value="Internship Program">Internship Program</option>
                <option value="Special Celebrations">
                  Special Celebrations
                </option>
                <option value="Survey">Survey</option>
                <option value="Event Planning">Event Planning</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                min="1"
                max="365"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowPublishing}
                  onChange={(e) =>
                    handleInputChange("allowPublishing", e.target.checked)
                  }
                  className="w-4 h-4"
                />
                <span className="text-slate-700 font-medium">
                  Allow publishing responses as stories
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendNotifications}
                  onChange={(e) =>
                    handleInputChange("sendNotifications", e.target.checked)
                  }
                  className="w-4 h-4"
                />
                <span className="text-slate-700 font-medium">
                  Send notifications to respondents
                </span>
              </label>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              Next: Form Fields
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: FORM FIELDS */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Form Fields
            </h2>
            <p className="text-slate-600">
              Configure the fields respondents will fill out
            </p>
          </div>

          {/* Error & Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-green-700 font-bold">{success}</p>
                <p className="text-green-600 text-sm mt-2">
                  Redirecting to campaign manager...
                </p>
              </div>
            </div>
          )}

          {/* Added Fields */}
          {formData.formFields.length > 0 && (
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-slate-900">
                Added Fields ({formData.formFields.length})
              </h3>
              <div className="space-y-3">
                {formData.formFields.map((field, idx) => (
                  <div
                    key={field.fieldId}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{field.label}</p>
                      <p className="text-xs text-slate-500">
                        {field.fieldType}
                        {field.required && " • Required"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveField(field.fieldId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Field */}
          <div className="bg-white rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-slate-900">Add New Field</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Field Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newField.fieldName}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      fieldName: e.target.value,
                    }))
                  }
                  placeholder="storyTitle"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Field Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newField.fieldType}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      fieldType: e.target.value,
                      options: [],
                    }))
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="textarea">Textarea</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) =>
                  setNewField((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="Story Title"
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={newField.placeholder}
                onChange={(e) =>
                  setNewField((prev) => ({
                    ...prev,
                    placeholder: e.target.value,
                  }))
                }
                placeholder="Enter placeholder text"
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
              />
            </div>

            {/* Options for select/radio/checkbox */}
            {["select", "radio", "checkbox"].includes(newField.fieldType) && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-bold text-slate-900">Options</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add an option"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddOption();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddOption}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

                {newField.options.length > 0 && (
                  <div className="space-y-2">
                    {newField.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded-lg"
                      >
                        <span className="text-slate-700">{opt}</span>
                        <button
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Length constraints */}
            {["text", "textarea"].includes(newField.fieldType) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Min Length
                  </label>
                  <input
                    type="number"
                    value={newField.minLength}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        minLength: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Max Length
                  </label>
                  <input
                    type="number"
                    value={newField.maxLength}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        maxLength: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Required */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) =>
                  setNewField((prev) => ({
                    ...prev,
                    required: e.target.checked,
                  }))
                }
                className="w-4 h-4"
              />
              <span className="text-slate-700 font-medium">
                This field is required
              </span>
            </label>

            <button
              onClick={handleAddField}
              className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add This Field
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={isLoading || formData.formFields.length === 0}
              className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Create Campaign
                </>
              )}
            </button>
          </div>

          {/* Created Campaign Info */}
          {createdCampaignId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={24} className="text-green-600" />
                <h3 className="font-bold text-green-900">Campaign Created!</h3>
              </div>

              <div className="bg-white rounded-lg p-4 font-mono text-sm">
                <p className="text-slate-600 mb-2">Campaign ID:</p>
                <div className="flex items-center gap-2">
                  <code className="text-slate-900 break-all flex-1">
                    {createdCampaignId}
                  </code>
                  <button
                    onClick={handleCopyCampaignId}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                    title="Copy ID"
                  >
                    <Copy size={16} className="text-slate-600" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-green-700">
                You can now share this campaign ID with respondents or manage
                responses in the Campaign Manager tab.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default CampaignCreator;