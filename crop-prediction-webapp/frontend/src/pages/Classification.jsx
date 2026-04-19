/**
 * Classification Page - Green agriculture-themed satellite image classifier
 */
import { useState, useEffect, useRef } from 'react';
import { classifyImage, fetchSampleImages, getSampleImageUrl } from '../api/predictions';
import FloatingLeaves from '../components/FloatingLeaves';

const CLASS_COLORS = {
  AnnualCrop: '#22c55e', Forest: '#166534', HerbaceousVegetation: '#86efac',
  Highway: '#94a3b8', Industrial: '#f59e0b', Pasture: '#4ade80',
  PermanentCrop: '#15803d', Residential: '#fb923c', River: '#38bdf8', SeaLake: '#0284c7',
};

const AG_CLASSES = new Set(['AnnualCrop', 'PermanentCrop', 'Pasture', 'HerbaceousVegetation']);

export default function Classification() {
  const [samples, setSamples] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('samples');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSampleImages().then(data => setSamples(data.samples || {})).catch(() => {});
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null); setError(null);
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSampleSelect = (filename) => {
    setResult(null); setError(null);
    setSelectedImage(filename);
    setPreviewUrl(getSampleImageUrl(filename));
  };

  const handleClassify = async () => {
    if (!selectedImage) return;
    setLoading(true); setError(null); setResult(null);
    try {
      let payload;
      if (typeof selectedImage === 'string') {
        payload = { imagePath: `crop-prediction-webapp/backend/sample_images/${selectedImage}` };
      } else {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage);
        });
        payload = { imageBase64: base64 };
      }
      setResult(await classifyImage(payload));
    } catch (err) {
      setError(err.message || 'Classification failed');
    } finally {
      setLoading(false);
    }
  };

  const sortedProbs = result ? Object.entries(result.classProbabilities).sort(([, a], [, b]) => b - a) : [];

  return (
    <div>
      {/* Header - Green themed like other pages */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-green-300/15 rounded-full blur-2xl" />
        </div>
        <FloatingLeaves />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm text-green-100 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse-soft" />
            Phase 2 · Deep Learning
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            🛰️ Land Cover Classification
          </h1>
          <p className="text-green-100/80 max-w-xl text-lg">
            Upload a satellite image or choose a sample. Our ResNet-50 + SE attention model classifies it with Grad-CAM visualization.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 50" fill="none" className="w-full"><path d="M0 25C360 50 720 0 1080 25C1260 37.5 1350 50 1440 50V50H0V25Z" fill="rgb(250 250 249)" /></svg>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Selection */}
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex bg-white rounded-2xl border border-green-100 p-1.5 shadow-sm">
              {[['samples', '🛰️ Samples'], ['upload', '📁 Upload']].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeTab === tab ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Samples */}
            {activeTab === 'samples' && (
              <div className="card-farm p-5">
                <p className="text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">
                  Select a Sentinel-2 patch from EuroSAT:
                </p>
                <div className="grid grid-cols-5 gap-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {Object.entries(samples).map(([cls, files]) =>
                    files.map((file) => (
                      <button key={file} onClick={() => handleSampleSelect(file)} title={cls}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                          selectedImage === file
                            ? 'border-green-500 ring-2 ring-green-200 shadow-lg'
                            : 'border-gray-200 hover:border-green-300'
                        }`}>
                        <img src={getSampleImageUrl(file)} alt={cls} className="w-full h-full object-cover" loading="lazy" />
                        {selectedImage === file && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Upload */}
            {activeTab === 'upload' && (
              <div onClick={() => fileInputRef.current?.click()}
                className="card-farm p-12 text-center cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-all duration-300 group">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-3xl">🛰️</span>
                </div>
                <p className="text-gray-700 font-semibold mb-1">Click to upload a satellite image</p>
                <p className="text-sm text-gray-400">JPG, PNG up to 10MB</p>
              </div>
            )}

            {/* Preview + Classify */}
            {previewUrl && (
              <div className="card-farm p-5 animate-fade-up">
                <div className="flex items-center gap-4">
                  <img src={previewUrl} alt="Selected" className="w-20 h-20 rounded-xl object-cover border-2 border-green-200 shadow-sm" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-3 truncate">
                      {typeof selectedImage === 'string' ? selectedImage.replace(/_/g, ' ').replace(/\.\w+$/, '') : selectedImage.name}
                    </p>
                    <button onClick={handleClassify} disabled={loading}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-600/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                      }`}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Running Model...
                        </span>
                      ) : '🔬 Classify Image'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 animate-fade-up">{error}</div>
            )}
          </div>

          {/* Right: Results */}
          <div>
            {!result && !loading && (
              <div className="card-farm p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mb-5">
                  <span className="text-4xl opacity-40">🛰️</span>
                </div>
                <p className="text-gray-400 font-semibold">Select an image and classify</p>
                <p className="text-sm text-gray-300 mt-1">Results with Grad-CAM will appear here</p>
              </div>
            )}

            {loading && (
              <div className="card-farm p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-green-200 border-t-green-500 animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid' }} />
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl">🧠</span></div>
                </div>
                <p className="text-gray-600 font-semibold">Running ResNet-50 + SE Attention</p>
                <p className="text-sm text-gray-400 mt-1">Analyzing satellite imagery...</p>
              </div>
            )}

            {result && (
              <div className="space-y-5 animate-slide-up">
                {/* Main Result */}
                <div className="card-farm overflow-hidden shadow-xl shadow-green-900/5">
                  <div className="px-6 py-6 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Predicted Class</p>
                        <p className="text-2xl font-black text-green-800">{result.predictedClass}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Confidence</p>
                        <p className={`text-3xl font-black ${result.confidence > 80 ? 'text-green-600' : result.confidence > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {result.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-500 text-sm">{result.description}</p>
                    {result.isAgriculture && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-bold">
                        🌱 Agriculture-related land cover
                      </div>
                    )}
                  </div>
                </div>

                {/* Probabilities */}
                <div className="card-farm p-6">
                  <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Class Probabilities</h3>
                  <div className="space-y-2.5">
                    {sortedProbs.map(([cls, prob], idx) => (
                      <div key={cls} className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-gray-500 w-28 truncate" title={cls}>
                          {AG_CLASSES.has(cls) ? '🌿 ' : ''}{cls}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="h-full rounded-full animate-bar-fill"
                            style={{ width: `${Math.max(prob, 0.5)}%`, backgroundColor: CLASS_COLORS[cls], animationDelay: `${idx * 50}ms` }} />
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 w-12 text-right tabular-nums">{prob}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grad-CAM */}
                {result.gradcam && (
                  <div className="card-farm p-6">
                    <h3 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Grad-CAM Attention Map</h3>
                    <p className="text-[11px] text-gray-400 mb-5">Regions the model focused on for classification</p>
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <img src={previewUrl} alt="Original" className="w-36 h-36 rounded-2xl object-cover border-2 border-green-200 shadow-md" />
                        <p className="text-[11px] text-gray-400 mt-2 font-semibold">Original</p>
                      </div>
                      <div className="text-green-300 text-2xl">→</div>
                      <div className="text-center">
                        <img src={`data:image/png;base64,${result.gradcam}`} alt="Grad-CAM" className="w-36 h-36 rounded-2xl border-2 border-green-200 shadow-md" />
                        <p className="text-[11px] text-gray-400 mt-2 font-semibold">Grad-CAM</p>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={() => { setResult(null); setSelectedImage(null); setPreviewUrl(null); }}
                  className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-bold text-sm hover:border-green-300 hover:text-green-700 transition-all duration-300">
                  Classify Another Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Model Info */}
        <div className="mt-14 card-farm p-6">
          <h3 className="text-xs font-bold text-gray-400 mb-5 uppercase tracking-wider">About the Model</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm">
            {[
              { label: 'Architecture', value: 'ResNet-50 + SE Attention', icon: '🧠' },
              { label: 'Dataset', value: 'EuroSAT (Sentinel-2)', icon: '🛰️' },
              { label: 'Accuracy', value: '98.2% on 10 classes', icon: '🎯' },
              { label: 'Interpretability', value: 'Grad-CAM Heatmaps', icon: '🔍' },
            ].map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg shrink-0">{m.icon}</div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{m.label}</p>
                  <p className="text-gray-700 font-semibold mt-0.5">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
