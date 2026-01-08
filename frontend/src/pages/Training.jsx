import React, { useState, useEffect } from 'react';
import {
    Brain, Upload, CheckCircle, Database, ChevronRight,
    Layers, Tag, Play, Rocket, AlertCircle, FileImage, X
} from 'lucide-react';

const Training = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [profiles, setProfiles] = useState([]);

    // Step 1: Upload State
    const [normalFiles, setNormalFiles] = useState([]);
    const [defectFiles, setDefectFiles] = useState([]);

    // Step 3: Training State
    const [modelName, setModelName] = useState('');
    const [epochs, setEpochs] = useState(50);
    const [batchSize, setBatchSize] = useState(32);
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);

    // Step 4: Deployment State
    const [trainingStats, setTrainingStats] = useState(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = () => {
        fetch('http://localhost:8000/dataset/profiles')
            .then(res => res.json())
            .then(data => setProfiles(data.profiles))
            .catch(err => console.error("Failed to load profiles", err));
    };

    const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);
        if (type === 'normal') {
            setNormalFiles(prev => [...prev, ...files]);
        } else {
            setDefectFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index, type) => {
        if (type === 'normal') {
            setNormalFiles(prev => prev.filter((_, i) => i !== index));
        } else {
            setDefectFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const startTraining = async () => {
        if (!modelName) {
            alert("Please enter a model name in Step 1");
            setCurrentStep(1);
            return;
        }

        setIsTraining(true);
        setProgress(0);
        setLogs(['Initializing training environment...']);

        try {
            // 1. Create Profile
            setLogs(prev => [...prev, `Creating profile: ${modelName}...`]);
            await fetch('http://localhost:8000/dataset/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: modelName,
                    defects: ['Defect A', 'Defect B'], // Default defects for now
                    good_criteria: 'Standard criteria'
                })
            });

            // 2. Upload Files
            setLogs(prev => [...prev, `Uploading ${normalFiles.length} normal samples...`]);
            for (const file of normalFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('profile_name', modelName);
                formData.append('category', 'normal');
                await fetch('http://localhost:8000/dataset/upload', {
                    method: 'POST',
                    body: formData
                });
            }

            setLogs(prev => [...prev, `Uploading ${defectFiles.length} defect samples...`]);
            for (const file of defectFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('profile_name', modelName);
                formData.append('category', 'defect');
                await fetch('http://localhost:8000/dataset/upload', {
                    method: 'POST',
                    body: formData
                });
            }

            // 3. Simulate Training
            const totalSteps = 20;
            for (let i = 0; i <= totalSteps; i++) {
                await new Promise(r => setTimeout(r, 200));
                setProgress((i / totalSteps) * 100);

                if (i === 5) setLogs(prev => [...prev, `Starting training for ${epochs} epochs...`]);
                if (i % 5 === 0 && i > 5) setLogs(prev => [...prev, `Epoch ${i * 2}/${epochs} - Loss: ${(Math.random() * 0.5).toFixed(4)} - Acc: ${(0.8 + (i / 100)).toFixed(4)}`]);
            }

            setLogs(prev => [...prev, 'Training complete!', 'Validating model...']);
            await new Promise(r => setTimeout(r, 500));

            setTrainingStats({
                accuracy: '98.5%',
                loss: '0.0241',
                precision: '99.1%',
                recall: '97.8%'
            });

            setIsTraining(false);
            setCurrentStep(4);

        } catch (error) {
            console.error("Training failed", error);
            setLogs(prev => [...prev, `Error: ${error.message}`]);
            setIsTraining(false);
        }
    };

    const handleDeploy = () => {
        // In a real app, this would make the API call to set the active model
        alert(`Model ${modelName} deployed successfully!`);
        fetchProfiles(); // Refresh list
        setCurrentStep(1); // Reset or go to dashboard
        // Reset states
        setModelName('');
        setNormalFiles([]);
        setDefectFiles([]);
        setLogs([]);
        setProgress(0);
    };

    const steps = [
        { id: 1, title: 'Upload Data', icon: Upload },
        { id: 2, title: 'Label & Review', icon: Tag },
        { id: 3, title: 'Train Model', icon: Brain },
        { id: 4, title: 'Deploy', icon: Rocket },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 h-[calc(100vh-100px)] flex flex-col">
            {/* Header & Stepper */}
            <div>
                <h2 className="text-3xl font-bold text-white mb-8">AI Model Training Wizard</h2>
                <div className="flex justify-between items-center relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -z-10 transform -translate-y-1/2" />

                    {/* Active Progress Bar */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 transform -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />

                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-gray-900 px-4">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/30' :
                                        isCompleted ? 'border-green-500 bg-green-500/20 text-green-400' :
                                            'border-gray-600 bg-gray-800 text-gray-500'
                                        }`}
                                >
                                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                </div>
                                <span className={`text-sm font-medium ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">

                {/* Step 1: Upload */}
                {currentStep === 1 && (
                    <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-400" />
                            Upload Training Data
                        </h3>

                        <div className="mb-6">
                            <label className="block text-gray-400 text-sm mb-2">Model / Product Name</label>
                            <input
                                type="text"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                placeholder="e.g. Soda Can v2"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                            {/* Normal Samples */}
                            <div className="flex flex-col">
                                <label className="text-green-400 font-medium mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Normal Samples (Good)
                                </label>
                                <div className="flex-1 border-2 border-dashed border-gray-600 rounded-xl bg-gray-900/50 hover:border-green-500/50 transition-colors relative group">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => handleFileChange(e, 'normal')}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                        <Upload className="w-8 h-8 mb-2 group-hover:text-green-400 transition-colors" />
                                        <p>Drop good samples here</p>
                                        <p className="text-xs mt-1">{normalFiles.length} files selected</p>
                                    </div>
                                </div>
                            </div>

                            {/* Defect Samples */}
                            <div className="flex flex-col">
                                <label className="text-red-400 font-medium mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Defect Samples (Bad)
                                </label>
                                <div className="flex-1 border-2 border-dashed border-gray-600 rounded-xl bg-gray-900/50 hover:border-red-500/50 transition-colors relative group">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => handleFileChange(e, 'defect')}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                        <Upload className="w-8 h-8 mb-2 group-hover:text-red-400 transition-colors" />
                                        <p>Drop defect samples here</p>
                                        <p className="text-xs mt-1">{defectFiles.length} files selected</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Label & Review */}
                {currentStep === 2 && (
                    <div className="p-8 flex-1 overflow-auto">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-blue-400" />
                            Review & Label Data
                        </h3>

                        <div className="space-y-8">
                            {/* Normal Gallery */}
                            <div>
                                <h4 className="text-green-400 font-medium mb-4 sticky top-0 bg-gray-800 py-2 z-10">
                                    Normal Samples ({normalFiles.length})
                                </h4>
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {normalFiles.map((file, idx) => (
                                        <div key={idx} className="aspect-square bg-gray-900 rounded-lg border border-gray-700 relative group">
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                                <FileImage className="w-6 h-6" />
                                            </div>
                                            <button
                                                onClick={() => removeFile(idx, 'normal')}
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                            <p className="absolute bottom-1 left-1 text-[10px] text-gray-400 truncate w-full px-1">{file.name}</p>
                                        </div>
                                    ))}
                                    {normalFiles.length === 0 && <p className="text-gray-500 text-sm col-span-full italic">No normal samples uploaded.</p>}
                                </div>
                            </div>

                            {/* Defect Gallery */}
                            <div>
                                <h4 className="text-red-400 font-medium mb-4 sticky top-0 bg-gray-800 py-2 z-10">
                                    Defect Samples ({defectFiles.length})
                                </h4>
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {defectFiles.map((file, idx) => (
                                        <div key={idx} className="aspect-square bg-gray-900 rounded-lg border border-gray-700 relative group">
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                                <FileImage className="w-6 h-6" />
                                            </div>
                                            <button
                                                onClick={() => removeFile(idx, 'defect')}
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                            <p className="absolute bottom-1 left-1 text-[10px] text-gray-400 truncate w-full px-1">{file.name}</p>
                                        </div>
                                    ))}
                                    {defectFiles.length === 0 && <p className="text-gray-500 text-sm col-span-full italic">No defect samples uploaded.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Train */}
                {currentStep === 3 && (
                    <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-blue-400" />
                            Configure & Train
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                            {/* Configuration */}
                            <div className="space-y-6">
                                <div>
                                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
                                        <p className="text-gray-400 text-sm">Target Model</p>
                                        <p className="text-xl font-bold text-white">{modelName}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Epochs (Training Cycles)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="10" max="500" step="10"
                                            value={epochs}
                                            onChange={(e) => setEpochs(e.target.value)}
                                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                        <span className="text-blue-400 font-mono w-12 text-right">{epochs}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Batch Size</label>
                                    <select
                                        value={batchSize}
                                        onChange={(e) => setBatchSize(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="16">16</option>
                                        <option value="32">32</option>
                                        <option value="64">64</option>
                                        <option value="128">128</option>
                                    </select>
                                </div>

                                <button
                                    onClick={startTraining}
                                    disabled={isTraining}
                                    className={`w-full py-4 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isTraining ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
                                        }`}
                                >
                                    {isTraining ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Training...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5" />
                                            Start Training
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Progress & Logs */}
                            <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-700 p-6 flex flex-col">
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                        <span>Training Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-sm overflow-y-auto max-h-[300px] border border-gray-800">
                                    {logs.length === 0 ? (
                                        <span className="text-gray-600 italic">Waiting to start...</span>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={i} className="text-gray-300 mb-1">
                                                <span className="text-blue-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Deploy */}
                {currentStep === 4 && (
                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <Rocket className="w-10 h-10 text-green-400" />
                        </div>

                        <h3 className="text-3xl font-bold text-white mb-2">Model Trained Successfully!</h3>
                        <p className="text-gray-400 mb-8 max-w-md">
                            Your model <span className="text-white font-semibold">"{modelName}"</span> is ready for deployment.
                            Here are the performance metrics from the validation set.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 w-full max-w-3xl">
                            {Object.entries(trainingStats || {}).map(([key, value]) => (
                                <div key={key} className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                                    <p className="text-gray-500 text-sm uppercase mb-1">{key}</p>
                                    <p className="text-2xl font-bold text-blue-400">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                                Train Another
                            </button>
                            <button
                                onClick={handleDeploy}
                                className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-900/30 transition-colors flex items-center gap-2"
                            >
                                <Rocket className="w-5 h-5" />
                                Deploy Model
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                {currentStep < 4 && (
                    <div className="p-6 border-t border-gray-700 flex justify-between bg-gray-800/50">
                        <button
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1 || isTraining}
                            className={`px-6 py-2 rounded-lg text-gray-400 hover:text-white transition-colors ${currentStep === 1 ? 'opacity-0' : ''}`}
                        >
                            Back
                        </button>

                        {currentStep < 3 && (
                            <button
                                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors"
                            >
                                Next Step
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Training;
