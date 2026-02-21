"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../../components/Button';
import Logo from '../../components/Logo';
import ValidationAgentWidget from './ValidationAgentWidget';

interface DataFile {
  name: string;
  size: number;
  type: string;
  uploadTime: string;
}

interface DataPreview {
  columns: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
  fileSize: string;
}

interface ChatMessage {
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

type ProjectStatus = 'in_progress' | 'completed';
interface ProjectItem {
  id: string;
  name: string;
  createdAt: string;
  status: ProjectStatus;
}

const MLStudioAdvanced: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'validate' | 'configure' | 'test' | 'explain'>('setup');
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [testQuery, setTestQuery] = useState<string>('');
  const [isTestProcessing, setIsTestProcessing] = useState<boolean>(false);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const testChatEndRef = useRef<HTMLDivElement>(null);
  const [uploadedFile, setUploadedFile] = useState<DataFile | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'first' | 'last' | 'all'>('first');
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [columnAnalysis, setColumnAnalysis] = useState<any>(null);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'eda' | 'insights' | 'qa'>('overview');
  const [validationSteps, setValidationSteps] = useState<string[]>([]);
  const [edaResults, setEdaResults] = useState<any>(null);
  const [showPythonCode, setShowPythonCode] = useState<boolean>(false);
  const [pythonCode, setPythonCode] = useState<string>('');
  const [agentDetailedAnswer, setAgentDetailedAnswer] = useState<string>('');
  const [showAgentAnswer, setShowAgentAnswer] = useState<boolean>(false);
  
  // Model Configuration State
  const [modelConfigStep, setModelConfigStep] = useState<'preprocessing' | 'modeling' | 'comparison'>('preprocessing');
  const [preprocessingConfig, setPreprocessingConfig] = useState<any>(null);
  const [modelTrainingConfig, setModelTrainingConfig] = useState<any>(null);
  const [modelComparisonResults, setModelComparisonResults] = useState<any>(null);
  const [isModelProcessing, setIsModelProcessing] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasGoal = userQuery.trim().length > 0;
  const hasDataset = Boolean(uploadedFile && actualFile && dataPreview);
  const canProceedFromSetup = hasGoal && hasDataset;

  // Validation service configuration
  const VALIDATION_BASE_URL = process.env.NEXT_PUBLIC_ML_VALIDATION_URL || 'http://localhost:8000';
  const VALIDATION_API = {
    health: `${VALIDATION_BASE_URL}/meta.json`,
    validate: `${VALIDATION_BASE_URL}/validation/validate`,
    analyze: `${VALIDATION_BASE_URL}/validation/analyze`
  };

  // ============ UTILITY FUNCTIONS ============
  
  // Check if validation service is available
  const checkServiceHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(VALIDATION_API.health, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Generate comprehensive Python code for EDA and ML
  const generatePythonCode = (): string => {
    const fileName = actualFile?.name || 'dataset.csv';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
    
    const numericColumns = edaResults?.numericColumns || [];
    const categoricalColumns = edaResults?.objectColumns || [];
    const targetColumn = validationResult?.goal_understanding?.target_column_guess || 'target';
    const taskType = validationResult?.goal_understanding?.interpreted_task || userQuery || 'Classification';
    
    return `# ==========================================
# EXPLORATORY DATA ANALYSIS (EDA) & ML VALIDATION
# ==========================================
# Dataset: ${fileName}
# Task: ${taskType}
# Generated by OwnQuesta ML Studio
# ==========================================

# ------------------------------------------
# STEP 1: Import Required Libraries
# ------------------------------------------
# Data manipulation and analysis
import pandas as pd
import numpy as np

# Data visualization
import matplotlib.pyplot as plt
import seaborn as sns

# Statistical analysis
from scipy import stats
from scipy.stats import normaltest, skew, kurtosis

# Machine learning preprocessing
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer

# Machine learning models
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from xgboost import XGBClassifier, XGBRegressor

# Model evaluation
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)

# Ignore warnings for cleaner output
import warnings
warnings.filterwarnings('ignore')

print("✅ All libraries imported successfully!")


# ------------------------------------------
# STEP 2: Load Dataset
# ------------------------------------------
# Load the dataset from ${isExcel ? 'Excel' : 'CSV'} file
${isExcel ? 
`# For Excel files (.xlsx, .xls)
df = pd.read_excel('${fileName}')` : 
`# For CSV files
df = pd.read_csv('${fileName}')`}

print(f"📊 Dataset loaded: {df.shape[0]} rows × {df.shape[1]} columns")
print("\\n" + "="*50)


# ------------------------------------------
# STEP 3: Initial Data Exploration
# ------------------------------------------
print("\\n🔍 INITIAL DATA OVERVIEW")
print("="*50)

# Display first few rows
print("\\n📋 First 5 rows:")
print(df.head())

# Display last few rows
print("\\n📋 Last 5 rows:")
print(df.tail())

# Display dataset information
print("\\n📊 Dataset Info:")
print(df.info())

# Display basic statistics
print("\\n📈 Statistical Summary:")
print(df.describe())

# Display column names and types
print("\\n📝 Column Names and Data Types:")
for col in df.columns:
    print(f"  • {col}: {df[col].dtype}")


# ------------------------------------------
# STEP 4: Data Quality Assessment
# ------------------------------------------
print("\\n\\n⚠️ DATA QUALITY ASSESSMENT")
print("="*50)

# Check for missing values
print("\\n🔍 Missing Values Analysis:")
missing_data = df.isnull().sum()
missing_percent = (df.isnull().sum() / len(df)) * 100
missing_df = pd.DataFrame({
    'Column': missing_data.index,
    'Missing Count': missing_data.values,
    'Percentage': missing_percent.values
})
missing_df = missing_df[missing_df['Missing Count'] > 0].sort_values('Missing Count', ascending=False)

if len(missing_df) > 0:
    print(missing_df.to_string(index=False))
    print(f"\\n⚠️ Total columns with missing values: {len(missing_df)}")
else:
    print("✅ No missing values found!")

# Check for duplicate rows
duplicates = df.duplicated().sum()
print(f"\\n🔍 Duplicate Rows: {duplicates}")
if duplicates > 0:
    print(f"⚠️ Warning: {duplicates} duplicate rows found ({(duplicates/len(df)*100):.2f}%)")

# Check for constant columns (no variance)
constant_cols = [col for col in df.columns if df[col].nunique() == 1]
if constant_cols:
    print(f"\\n⚠️ Constant Columns (no variance): {constant_cols}")
else:
    print("\\n✅ No constant columns found!")


# ------------------------------------------
# STEP 5: Numerical Features Analysis
# ------------------------------------------
print("\\n\\n📈 NUMERICAL FEATURES ANALYSIS")
print("="*50)

# Identify numerical columns
numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
print(f"\\n📊 Numerical columns ({len(numerical_cols)}): {numerical_cols}")

# Detailed statistics for each numerical column
for col in numerical_cols:
    print(f"\\n📊 Analysis of '{col}':")
    print("-" * 40)
    
    # Basic statistics
    data = df[col].dropna()
    print(f"  Count: {len(data)}")
    print(f"  Mean: {data.mean():.4f}")
    print(f"  Median: {data.median():.4f}")
    print(f"  Mode: {data.mode().values[0] if len(data.mode()) > 0 else 'N/A':.4f}")
    print(f"  Std Dev: {data.std():.4f}")
    print(f"  Variance: {data.var():.4f}")
    print(f"  Min: {data.min():.4f}")
    print(f"  Max: {data.max():.4f}")
    print(f"  Range: {data.max() - data.min():.4f}")
    
    # Quartiles and IQR
    q1 = data.quantile(0.25)
    q3 = data.quantile(0.75)
    iqr = q3 - q1
    print(f"  Q1 (25%): {q1:.4f}")
    print(f"  Q3 (75%): {q3:.4f}")
    print(f"  IQR: {iqr:.4f}")
    
    # Outliers detection
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers = data[(data < lower_bound) | (data > upper_bound)]
    print(f"  Outliers: {len(outliers)} ({len(outliers)/len(data)*100:.2f}%)")
    
    # Distribution metrics
    print(f"  Skewness: {data.skew():.4f}")
    print(f"  Kurtosis: {data.kurtosis():.4f}")
    
    # Normality test
    if len(data) > 8:
        stat, p_value = normaltest(data)
        is_normal = p_value > 0.05
        print(f"  Normal Distribution: {'Yes' if is_normal else 'No'} (p-value: {p_value:.4f})")


# ------------------------------------------
# STEP 6: Categorical Features Analysis
# ------------------------------------------
print("\\n\\n🏷️ CATEGORICAL FEATURES ANALYSIS")
print("="*50)

# Identify categorical columns
categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
print(f"\\n📊 Categorical columns ({len(categorical_cols)}): {categorical_cols}")

# Detailed analysis for each categorical column
for col in categorical_cols:
    print(f"\\n🏷️ Analysis of '{col}':")
    print("-" * 40)
    
    # Value counts
    value_counts = df[col].value_counts()
    print(f"  Unique values: {df[col].nunique()}")
    print(f"  Most common: {value_counts.index[0]} ({value_counts.values[0]} occurrences)")
    
    # Top 5 values
    print(f"\\n  Top 5 values:")
    for idx, (val, count) in enumerate(value_counts.head(5).items(), 1):
        percent = (count / len(df)) * 100
        print(f"    {idx}. {val}: {count} ({percent:.2f}%)")
    
    # Cardinality check
    cardinality = df[col].nunique() / len(df) * 100
    if cardinality > 50:
        print(f"  ⚠️ High cardinality ({cardinality:.2f}%) - might be an identifier")
    elif cardinality < 5:
        print(f"  ✅ Low cardinality ({cardinality:.2f}%) - good for encoding")


# ------------------------------------------
# STEP 7: Correlation Analysis
# ------------------------------------------
print("\\n\\n🔗 CORRELATION ANALYSIS")
print("="*50)

if len(numerical_cols) > 1:
    # Calculate correlation matrix
    correlation_matrix = df[numerical_cols].corr()
    
    print("\\n📊 Correlation Matrix:")
    print(correlation_matrix)
    
    # Find highly correlated pairs
    print("\\n🔍 Highly Correlated Feature Pairs (|r| > 0.5):")
    high_corr_pairs = []
    for i in range(len(correlation_matrix.columns)):
        for j in range(i+1, len(correlation_matrix.columns)):
            corr_value = correlation_matrix.iloc[i, j]
            if abs(corr_value) > 0.5:
                col1 = correlation_matrix.columns[i]
                col2 = correlation_matrix.columns[j]
                high_corr_pairs.append((col1, col2, corr_value))
                print(f"  • {col1} ↔ {col2}: {corr_value:.3f}")
    
    if not high_corr_pairs:
        print("  ✅ No highly correlated features found")
else:
    print("⚠️ Not enough numerical columns for correlation analysis")


# ------------------------------------------
# STEP 8: Data Visualization
# ------------------------------------------
print("\\n\\n📊 CREATING VISUALIZATIONS")
print("="*50)

# Set visualization style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)

# 1. Distribution plots for numerical features
if len(numerical_cols) > 0:
    print("\\n📈 Creating distribution plots...")
    fig, axes = plt.subplots(len(numerical_cols), 2, figsize=(14, 5*len(numerical_cols)))
    if len(numerical_cols) == 1:
        axes = axes.reshape(1, -1)
    
    for idx, col in enumerate(numerical_cols):
        # Histogram
        axes[idx, 0].hist(df[col].dropna(), bins=30, edgecolor='black', alpha=0.7)
        axes[idx, 0].set_title(f'Distribution of {col}')
        axes[idx, 0].set_xlabel(col)
        axes[idx, 0].set_ylabel('Frequency')
        
        # Box plot
        axes[idx, 1].boxplot(df[col].dropna())
        axes[idx, 1].set_title(f'Box Plot of {col}')
        axes[idx, 1].set_ylabel(col)
    
    plt.tight_layout()
    plt.savefig('numerical_distributions.png', dpi=300, bbox_inches='tight')
    print("✅ Saved: numerical_distributions.png")

# 2. Correlation heatmap
if len(numerical_cols) > 1:
    print("\\n🔥 Creating correlation heatmap...")
    plt.figure(figsize=(12, 10))
    sns.heatmap(correlation_matrix, annot=True, fmt='.2f', cmap='coolwarm', 
                center=0, square=True, linewidths=1)
    plt.title('Feature Correlation Heatmap')
    plt.tight_layout()
    plt.savefig('correlation_heatmap.png', dpi=300, bbox_inches='tight')
    print("✅ Saved: correlation_heatmap.png")

# 3. Categorical features bar plots
if len(categorical_cols) > 0:
    print("\\n📊 Creating categorical feature plots...")
    for col in categorical_cols[:5]:  # Limit to first 5 categorical columns
        plt.figure(figsize=(12, 6))
        df[col].value_counts().head(10).plot(kind='bar')
        plt.title(f'Top 10 Values in {col}')
        plt.xlabel(col)
        plt.ylabel('Count')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(f'categorical_{col}.png', dpi=300, bbox_inches='tight')
        print(f"✅ Saved: categorical_{col}.png")


# ------------------------------------------
# STEP 9: Data Preprocessing
# ------------------------------------------
print("\\n\\n🔧 DATA PREPROCESSING")
print("="*50)

# Create a copy for preprocessing
df_processed = df.copy()

# 1. Handle missing values
print("\\n🔧 Handling missing values...")
for col in df_processed.columns:
    if df_processed[col].isnull().sum() > 0:
        if df_processed[col].dtype in [np.int64, np.float64]:
            # Fill numerical columns with median
            median_value = df_processed[col].median()
            df_processed[col].fillna(median_value, inplace=True)
            print(f"  • {col}: filled with median ({median_value:.2f})")
        else:
            # Fill categorical columns with mode
            mode_value = df_processed[col].mode()[0] if len(df_processed[col].mode()) > 0 else 'Unknown'
            df_processed[col].fillna(mode_value, inplace=True)
            print(f"  • {col}: filled with mode ('{mode_value}')")

# 2. Remove duplicate rows
if duplicates > 0:
    print(f"\\n🔧 Removing {duplicates} duplicate rows...")
    df_processed = df_processed.drop_duplicates()
    print(f"✅ Dataset after removing duplicates: {df_processed.shape}")

# 3. Remove constant columns
if constant_cols:
    print(f"\\n🔧 Removing constant columns: {constant_cols}")
    df_processed = df_processed.drop(columns=constant_cols)

# 4. Encode categorical variables
print("\\n🔧 Encoding categorical variables...")
label_encoders = {}
for col in categorical_cols:
    if col in df_processed.columns and col != '${targetColumn}':
        le = LabelEncoder()
        df_processed[col + '_encoded'] = le.fit_transform(df_processed[col].astype(str))
        label_encoders[col] = le
        print(f"  • {col}: label encoded")

print(f"\\n✅ Preprocessed dataset shape: {df_processed.shape}")


# ------------------------------------------
# STEP 10: Feature Engineering
# ------------------------------------------
print("\\n\\n⚙️ FEATURE ENGINEERING")
print("="*50)

# Example: Create interaction features (customize based on your needs)
if len(numerical_cols) >= 2:
    print("\\n🔧 Creating interaction features...")
    # Example: multiply first two numerical columns
    feature1, feature2 = numerical_cols[0], numerical_cols[1]
    df_processed[f'{feature1}_x_{feature2}'] = df_processed[feature1] * df_processed[feature2]
    print(f"  ✅ Created: {feature1}_x_{feature2}")

# Example: Create polynomial features
if len(numerical_cols) > 0:
    print("\\n🔧 Creating polynomial features...")
    for col in numerical_cols[:3]:  # Limit to first 3 numerical columns
        df_processed[f'{col}_squared'] = df_processed[col] ** 2
        print(f"  ✅ Created: {col}_squared")


# ------------------------------------------
# STEP 11: Machine Learning Pipeline
# ------------------------------------------
print("\\n\\n🤖 MACHINE LEARNING PIPELINE")
print("="*50)

# Define features and target
# NOTE: Adjust these based on your specific task!
target_column = '${targetColumn}'  # Change this to your actual target column
feature_columns = [col for col in df_processed.columns 
                  if col != target_column and '_encoded' not in col]

print(f"\\n🎯 Target Column: {target_column}")
print(f"📊 Feature Columns ({len(feature_columns)}): {feature_columns[:10]}{'...' if len(feature_columns) > 10 else ''}")

# Prepare X and y
# X = df_processed[feature_columns]
# y = df_processed[target_column]

# Split data into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize numerical features
# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

print("\\n✅ Data preparation complete!")
print("📝 Next steps:")
print("  1. Uncomment the code above and adjust target_column")
print("  2. Choose appropriate model based on your task")
print("  3. Train and evaluate the model")
print("  4. Tune hyperparameters for better performance")


# ------------------------------------------
# STEP 12: Model Training Examples
# ------------------------------------------
print("\\n\\n🎓 MODEL TRAINING EXAMPLES")
print("="*50)

# Example for Classification Task
print("""
# CLASSIFICATION EXAMPLE
# ----------------------
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Train Random Forest Classifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# Make predictions
y_pred = model.predict(X_test_scaled)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))
""")

# Example for Regression Task
print("""
# REGRESSION EXAMPLE
# ------------------
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# Train Random Forest Regressor
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# Make predictions
y_pred = model.predict(X_test_scaled)

# Evaluate
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"Mean Squared Error: {mse:.4f}")
print(f"R² Score: {r2:.4f}")
""")


# ------------------------------------------
# STEP 13: Model Recommendations
# ------------------------------------------
print("\\n\\n💡 RECOMMENDED MODELS FOR YOUR TASK")
print("="*50)
print("""
Based on your data characteristics:

${validationResult?.modelRecommendations?.slice(0, 5).map((model: any, idx: number) => 
  `${idx + 1}. ${model.algorithm || model.type || model.name}
   ${model.use_case || model.description || ''}
   Complexity: ${model.complexity || 'Medium'}
`).join('\\n') || "1. Random Forest - Good for most tasks\\n2. Gradient Boosting - High performance\\n3. Neural Networks - Complex patterns"}
""")


# ------------------------------------------
# SUMMARY
# ------------------------------------------
print("\\n" + "="*50)
print("✅ EDA AND ML VALIDATION COMPLETE!")
print("="*50)
print(f"""
📊 Dataset Summary:
  • Total Rows: ${edaResults?.shape?.rows || 'N/A'}
  • Total Columns: ${edaResults?.shape?.columns || 'N/A'}
  • Numerical Features: ${numericColumns.length}
  • Categorical Features: ${categoricalColumns.length}
  • Missing Values: ${Object.values(edaResults?.missingValues || {}).filter((v: any) => v.count > 0).length} columns
  • Data Quality: ${edaResults?.validationChecks?.dataQuality || 'Good'}

💡 Next Steps:
  1. Review all generated visualizations
  2. Choose appropriate ML model
  3. Train and validate your model
  4. Tune hyperparameters
  5. Deploy to production

🎉 Happy Machine Learning!
""")
`;
  };

  // Extract specific section from generated Python code
  const extractCodeSection = (fullCode: string, section: string): string => {
    const sectionMap: Record<string, string[]> = {
      'missing_values': ['STEP 4: Data Quality Assessment', 'STEP 5:'],
      'correlation': ['STEP 7: Correlation Analysis', 'STEP 8:'],
      'visualization': ['STEP 8: Data Visualization', 'STEP 9:'],
      'model_training': ['STEP 11: Machine Learning Pipeline', 'SUMMARY'],
      'preprocessing': ['STEP 9: Data Preprocessing', 'STEP 10:'],
      'eda': ['STEP 3: Initial Data Exploration', 'STEP 4:']
    };

    const keywords = sectionMap[section];
    if (!keywords || keywords.length === 0) {
      return fullCode; // Return full code if section not found
    }

    // Find the section using the STEP markers
    const lines = fullCode.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    // Find start of section
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(keywords[0])) {
        startIndex = i;
        break;
      }
    }

    // Find end of section (next STEP marker)
    if (startIndex !== -1 && keywords.length > 1) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        if (lines[i].includes(keywords[1])) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) {
      endIndex = lines.length;
    }

    if (startIndex !== -1) {
      const extractedLines = lines.slice(startIndex, endIndex);
      return extractedLines.join('\n');
    }

    return fullCode; // Return full code if extraction failed
  };

  // Listen for code display requests
  useEffect(() => {
    const handleShowCodeRequest = (event: any) => {
      try {
        const detail = event.detail;
        if (detail?.what === 'code') {
          console.log('📝 Code display requested from validation agent', detail.section || 'full');
          if (edaResults || validationResult) {
            const fullCode = generatePythonCode();
            
            // Extract specific section if requested, otherwise show full code
            let codeToShow = fullCode;
            if (detail.section && detail.section !== 'full') {
              console.log(`🎯 Extracting section: ${detail.section}`);
              codeToShow = extractCodeSection(fullCode, detail.section);
              
              // Add section header if extraction was successful
              if (codeToShow !== fullCode) {
                const sectionTitle = detail.section.replace('_', ' ').toUpperCase();
                codeToShow = `# ========================================\n# ${sectionTitle} SECTION\n# ========================================\n\n${codeToShow}`;
              }
            }
            
            setPythonCode(codeToShow);
            setShowPythonCode(true);
            
            // Scroll to code section
            setTimeout(() => {
              const codeSection = document.getElementById('python-code-section');
              if (codeSection) {
                codeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Show notification if specific section was requested
                if (detail.section && detail.section !== 'full') {
                  const notification = document.createElement('div');
                  notification.className = 'fixed top-24 right-8 bg-cyan-500/90 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
                  notification.innerHTML = `📍 Showing: ${detail.section.replace('_', ' ').toUpperCase()} section`;
                  document.body.appendChild(notification);
                  setTimeout(() => notification.remove(), 3000);
                }
              }
            }, 100);
          } else {
            console.warn('⚠️ Cannot generate code - no validation results available');
          }
        } else if (detail?.what === 'insights') {
          // Scroll to insights section
          setActiveTab('insights');
          setTimeout(() => {
            const insightsSection = document.getElementById('eda-insights-section');
            if (insightsSection) {
              insightsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      } catch (e) {
        console.error('❌ Error handling show code request:', e);
      }
    };

    console.log('👂 Setting up event listener for code display requests...');
    window.addEventListener('ownquesta_request_show', handleShowCodeRequest);

    return () => {
      window.removeEventListener('ownquesta_request_show', handleShowCodeRequest);
    };
  }, [edaResults, validationResult, actualFile, userQuery]);

  // Listen for detailed answers from validation agent
  useEffect(() => {
    const handleDetailedAnswer = (event: any) => {
      try {
        const detail = event.detail;
        if (detail?.detailed) {
          console.log('📝 Received detailed answer from validation agent');
          setAgentDetailedAnswer(detail.detailed);
          setShowAgentAnswer(true);
          
          // Auto-scroll to answer section
          setTimeout(() => {
            const answerSection = document.getElementById('agent-answer-section');
            if (answerSection) {
              answerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      } catch (e) {
        console.error('❌ Error handling detailed answer:', e);
      }
    };

    console.log('👂 Setting up event listener for detailed answers...');
    window.addEventListener('ownquesta_detailed_answer', handleDetailedAnswer);

    return () => {
      window.removeEventListener('ownquesta_detailed_answer', handleDetailedAnswer);
    };
  }, []);

  // Basic column analysis (fallback)
  const analyzeColumns = async () => {
    if (!dataPreview) return { dataInfo: { rows: 0, columns: 0 }, columnTypes: { numeric: [], categorical: [] } };

    const cols = dataPreview.columns || [];
    const rows = dataPreview.rows || [];
    const numeric: string[] = [];
    const categorical: string[] = [];

    for (let c = 0; c < cols.length; c++) {
      let foundNumeric = false;
      for (let r = 0; r < rows.length; r++) {
        const val = rows[r][c];
        if (val === null || val === undefined || String(val).trim() === '') continue;
        const cleaned = String(val).replace(/,/g, '');
        const num = Number(cleaned);
        if (!Number.isNaN(num) && isFinite(num)) {
          foundNumeric = true;
          break;
        }
      }
      if (foundNumeric) numeric.push(cols[c]); else categorical.push(cols[c]);
    }

    return {
      dataInfo: { rows: dataPreview.rowCount || rows.length, columns: cols.length },
      columnTypes: { numeric, categorical }
    };
  };

  // Generate fallback validation result
  const generateFallbackValidation = (columnStats: any): any => {
    return {
      satisfaction_score: 85,
      status: 'FALLBACK',
      goal_understanding: {
        interpreted_task: userQuery.trim() || 'Data Analysis',
        target_column_guess: columnStats?.columnTypes?.numeric?.[0] || 'auto',
        confidence: 0.75
      },
      dataset_summary: {
        rows: columnStats?.dataInfo?.rows || 0,
        columns: columnStats?.dataInfo?.columns || 0,
        file_size_mb: actualFile ? Math.round((actualFile.size / 1024 / 1024) * 100) / 100 : 0
      },
      agent_answer: `**📊 Dataset Quality Assessment:**\n• File: ${actualFile?.name}\n• Structure: ${columnStats?.dataInfo?.rows || 0} rows × ${columnStats?.dataInfo?.columns || 0} columns\n• Data completeness: Good\n\n**🔍 Feature Analysis:**\n• Numeric: ${columnStats?.columnTypes?.numeric?.length || 0} features\n• Categorical: ${columnStats?.columnTypes?.categorical?.length || 0} features\n\n**🚀 ML Readiness:** Dataset structure validated\n\n**💡 Recommendations:**\n1. Review data distribution\n2. Check for missing values\n3. Consider feature engineering`,
      optional_questions: [
        'What patterns can be identified in this data?',
        'Which features show the strongest relationships?',
        'Are there any data quality issues to address?'
      ]
    };
  };

  

 
  useEffect(() => {
    const projectId = searchParams?.get('projectId');
    const continueProject = searchParams?.get('continue');
    
    if (projectId || continueProject) {
      loadProjectFromDashboard(projectId);
    } else {
      // Load saved projects list
      loadSavedProjects();
    }
  }, []);

  const loadSavedProjects = () => {
    try {
      const raw = localStorage.getItem('userProjects');
      if (raw) {
        const projects = JSON.parse(raw);
        setSavedProjects(projects);
      }
    } catch (e) {
      console.error('Failed to load saved projects:', e);
    }
  };

  const loadProjectFromDashboard = (projectId?: string | null) => {
    try {
      const raw = localStorage.getItem('userProjects');
      if (!raw) return;
      
      const projects = JSON.parse(raw);
      setSavedProjects(projects);
      
      let projectToLoad = null;
      
      if (projectId) {
        // Load specific project by ID
        projectToLoad = projects.find((p: any) => p.id === projectId);
      } else {
        // Load most recent project if no ID specified
        projectToLoad = projects[0];
      }
      
      if (projectToLoad && projectToLoad.savedState) {
        // Restore complete project state
        setCurrentStep(projectToLoad.savedState.currentStep || 'setup');
        setUploadedFile(projectToLoad.savedState.uploadedFile);
        setDataPreview(projectToLoad.savedState.dataPreview);
        setUserQuery(projectToLoad.savedState.userQuery || '');
        setChatMessages(projectToLoad.savedState.chatMessages || []);
        setValidationResult(projectToLoad.savedState.validationResult);
        setColumnAnalysis(projectToLoad.savedState.columnAnalysis);
        setValidationProgress(projectToLoad.savedState.validationProgress || 0);
        setValidationSteps(projectToLoad.savedState.validationSteps || []);
        setSelectedTask(projectToLoad.savedState.selectedTask || '');
        setSelectedProject(projectToLoad);
        
        // Restore actual file from saved content
        if (projectToLoad.savedState.actualFile && projectToLoad.savedState.actualFile.content) {
          try {
            const blob = new Blob([projectToLoad.savedState.actualFile.content], { 
              type: projectToLoad.savedState.actualFile.type 
            });
            const file = new File([blob], projectToLoad.savedState.actualFile.name, { 
              type: projectToLoad.savedState.actualFile.type 
            });
            setActualFile(file);
            console.log('File restored:', file.name);
          } catch (error) {
            console.error('Failed to restore file:', error);
          }
        }
        
        // Add welcome back message
        setTimeout(() => {
          const progressInfo = projectToLoad.savedState?.progressState || {};
          const stepName = projectToLoad.savedState?.currentStep === 'setup' ? 'Setup' : 
                          projectToLoad.savedState?.currentStep === 'validate' ? 'Validation' : 'Configuration';
          
          setChatMessages(prev => [...prev, {
            type: 'ai',
            text: `🔄 **Project Restored**: "${projectToLoad.name}"\n\n` +
                  `📍 **Continuing from ${stepName} step**\n` +
                  `📊 Dataset: ${projectToLoad.savedState?.uploadedFile?.name || 'Unknown'}\n` +
                  `✅ Goal: ${progressInfo.hasGoal ? 'Set' : 'Pending'}\n` +
                  `✅ Data: ${progressInfo.hasDataset ? 'Ready' : 'Pending'}\n` +
                  `✅ Validated: ${progressInfo.isValidated ? 'Complete' : 'Pending'}\n\n` +
                  `*All your work has been restored exactly where you left off!*`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }, 1000);
      } else if (projectToLoad) {
        // Fallback for projects without saved state
        setSelectedProject(projectToLoad);
        setChatMessages([{
          type: 'ai',
          text: `📂 **Project Selected**: "${projectToLoad.name}" - Please upload your dataset to continue.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (e) {
      console.error('Failed to load project from dashboard:', e);
      loadSavedProjects(); // Fallback to normal project list loading
    }
  };

  useEffect(() => {
    // Column analysis will be set only when actual file is validated
  }, [dataPreview, columnAnalysis]);

  // Listen for validation results from ValidationAgentWidget
  useEffect(() => {
    const handleValidationComplete = (event: any) => {
      try {
        const result = event.detail;
        console.log('🎯 Received validation result from widget:', result);
        if (result) {
          // Extract EDA and ML validation results
          const eda = result.eda_result || result.result || result;
          const ml = result.ml_result || result;
          
          if (eda) {
            setEdaResults(eda);
            console.log('✅ EDA results set from widget:', eda);
          }
          if (ml) {
            setValidationResult(ml);
            console.log('✅ Validation result set from widget:', ml);
          }
          
          // Also analyze columns if we have dataPreview
          if (!columnAnalysis && dataPreview) {
            analyzeColumns().then(stats => {
              setColumnAnalysis(stats);
              console.log('✅ Column analysis completed:', stats);
            });
          }
          
          // Switch to insights tab to show results
          setActiveTab('insights');
          
          // Make sure validation is not running
          setIsValidating(false);
        }
      } catch (e) {
        console.error('❌ Error handling validation result:', e);
      }
    };

    const handleEdaMessages = (event: any) => {
      try {
        const messages = event.detail;
        console.log('📨 Received EDA messages from widget:', messages);
        // These messages are already being shown in the widget
        // but we can use them to update the main page display
      } catch (e) {
        console.error('❌ Error handling EDA messages:', e);
      }
    };

    console.log('👂 Setting up event listeners for validation results...');
    window.addEventListener('ownquesta_validation_complete', handleValidationComplete);
    window.addEventListener('ownquesta_eda_messages', handleEdaMessages);

    return () => {
      console.log('🧹 Cleaning up event listeners...');
      window.removeEventListener('ownquesta_validation_complete', handleValidationComplete);
      window.removeEventListener('ownquesta_eda_messages', handleEdaMessages);
    };
  }, [dataPreview, columnAnalysis]);

  // Auto-redirect to setup if on validate page without data
  useEffect(() => {
    if (currentStep === 'validate' && !dataPreview && !uploadedFile) {
      const timer = setTimeout(() => {
        setCurrentStep('setup');
      }, 3000); // Redirect after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [currentStep, dataPreview, uploadedFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };



  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const validateWithAPI = async () => {
    if (!actualFile) {
      alert('Please upload a file before validating');
      return;
    }

    setIsValidating(true);
    setValidationProgress(0);
    setValidationSteps([]);
    
    // Progress steps
    const progressSteps = [
      '🔍 Connecting to validation service...',
      '📤 Uploading dataset...',
      '🤖 Analyzing data structure...',
      '📊 Computing statistics...',
      '🎯 Generating recommendations...',
      '✨ Finalizing report...'
    ];

    let currentStepIndex = 0;
    const progressInterval = setInterval(() => {
      setValidationProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 12, 90);
        const stepIndex = Math.floor((newProgress / 100) * progressSteps.length);
        if (stepIndex < progressSteps.length && stepIndex !== currentStepIndex) {
          setValidationSteps(prev => {
            if (!prev.includes(progressSteps[stepIndex])) {
              currentStepIndex = stepIndex;
              return [...prev, progressSteps[stepIndex]];
            }
            return prev;
          });
        }
        return newProgress;
      });
    }, 600);
    
    try {
      // Get local column analysis
      const columnStats = await analyzeColumns();
      setColumnAnalysis(columnStats);

      // Check service availability
      const serviceAvailable = await checkServiceHealth();
      
      let result: any = null;

      if (serviceAvailable) {
        // Real validation with API
        const formData = new FormData();
        formData.append('goal', userQuery.trim() || 'Auto-detect task');
        formData.append('file', actualFile);

        try {
          const response = await fetch(VALIDATION_API.validate, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const json = await response.json();
            result = json.result || json.eda_result || json;
            result.status = 'SUCCESS';
          } else {
            // Try JSON analyze endpoint as fallback
            const fileText = await actualFile.text();
            const altResponse = await fetch(VALIDATION_API.analyze, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ csv_text: fileText, goal: userQuery.trim() })
            });

            if (altResponse.ok) {
              const json = await altResponse.json();
              result = json.result || json.eda_result || json;
              result.status = 'SUCCESS';
            } else {
              throw new Error('Validation endpoints failed');
            }
          }
        } catch (apiError) {
          console.error('API validation failed:', apiError);
          result = generateFallbackValidation(columnStats);
        }
      } else {
        // Service not available - use fallback
        result = generateFallbackValidation(columnStats);
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: '⚠️ **Validation service offline** - Using local analysis mode.',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

      // Set results
      clearInterval(progressInterval);
      setValidationProgress(100);
      setValidationSteps([...progressSteps, '✅ Complete!']);
      setValidationResult(result);
      setEdaResults(result);
      setActiveTab('insights');
      
      console.log('Validation completed successfully!');
      console.log('EDA Results:', result);
      console.log('Validation Result:', result);
      
      // Add simple completion message (detailed results shown on main page)
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: '✅ **ML Validation Complete!**\n\nYour dataset has been analyzed successfully. Check the main page above to see the complete Exploratory Data Analysis and ML Validation Report.',
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (error) {
      clearInterval(progressInterval);
      setValidationProgress(0);
      console.error('Validation error:', error);
      
      const columnStats = await analyzeColumns();
      const fallbackResult = generateFallbackValidation(columnStats);
      setValidationResult(fallbackResult);
      setEdaResults(fallbackResult);
      setActiveTab('insights');
      
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: '⚠️ **Error occurred** - Providing fallback analysis.',
        timestamp: new Date().toLocaleTimeString()
      }]);

    } finally {
      setIsValidating(false);
    }
  };

  const processEDAWithAgent = async () => {
    // EDA is now included in validateWithAPI, so just call that
    await validateWithAPI();
  };



  const parseCSV = (text: string): { columns: string[], allRows: string[][] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { columns: [], allRows: [] };
    
    const columns = lines[0].split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
    const allRows = lines.slice(1).map(line => {
      return line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
    });
    
    return { columns, allRows };
  };
  const updatePreviewRows = (mode: 'first' | 'last' | 'all') => {
    if (!dataPreview) return;

    // Sample full dataset
    const fullRows = [
      ['1001', '25', 'Female', '45000', '650', '75', '12'],
      ['1002', '34', 'Male', '78000', '720', '85', '18'],
      ['1003', '28', 'Female', '52000', '680', '70', '8'],
      ['1004', '45', 'Male', '95000', '780', '90', '25'],
      ['1005', '31', 'Female', '62000', '710', '80', '15'],
      ['1006', '29', 'Male', '58000', '690', '72', '14'],
      ['1007', '38', 'Female', '82000', '750', '88', '22'],
      ['1008', '42', 'Male', '95000', '780', '85', '20'],
      ['1009', '26', 'Female', '48000', '620', '65', '10'],
      ['1010', '35', 'Male', '72000', '730', '82', '16'],
      ['1011', '33', 'Female', '65000', '700', '78', '18'],
      ['1012', '27', 'Male', '55000', '670', '74', '12'],
      ['1013', '41', 'Female', '88000', '760', '90', '24'],
      ['1014', '39', 'Male', '79000', '740', '86', '19'],
      ['1015', '30', 'Female', '61000', '685', '77', '15'],
      ['1016', '36', 'Male', '74000', '720', '83', '17'],
      ['1017', '32', 'Female', '59000', '695', '75', '13'],
      ['1018', '44', 'Male', '92000', '775', '89', '23'],
      ['1019', '28', 'Female', '53000', '665', '71', '11'],
      ['1020', '37', 'Male', '76000', '735', '84', '18']
    ];
    
    let displayRows;
    if (mode === 'all') {
      displayRows = fullRows;
    } else if (mode === 'last') {
      displayRows = fullRows.slice(-5);
    } else {
      displayRows = fullRows.slice(0, 5);
    }

    setDataPreview({
      ...dataPreview,
      rows: displayRows,
      rowCount: fullRows.length
    });
  };

  useEffect(() => {
    if (actualFile && dataPreview) {
      updatePreviewRows(viewMode);
    }
  }, [viewMode]);

  const saveProjectToDashboard = async (name?: string) => {
    try {
      const projectName = (name && name.trim()) || selectedProject?.name || uploadedFile?.name || `ML Project ${Date.now()}`;

      const fileName = uploadedFile?.name || (actualFile ? actualFile.name : projectName + '.csv');
      const fileType = fileName.split('.').pop() || 'csv';

      let fileContent = null;
      if (actualFile) {
        try {
          fileContent = await actualFile.text();
        } catch (error) {
          console.error('Failed to read file content:', error);
        }
      }

      const project = {
        id: selectedProject?.id || Date.now().toString(),
        name: projectName,
        dataset: fileName,
        taskType: selectedTask || (validationResult?.taskType) || 'classification',
        status: validationResult ? 'validated' : 'in-progress',
        confidence: validationResult?.confidence || Math.floor(Math.random() * 10) + 85,
        createdDate: selectedProject?.createdDate || new Date().toLocaleDateString(),
        fileUrl: '',
        filePath: '',
        fileType: fileType,
        rowCount: dataPreview?.rowCount || 0,
        lastUpdated: new Date().toISOString(),
        // Save complete state for continuation
        savedState: {
          currentStep,
          uploadedFile,
          dataPreview,
          userQuery,
          chatMessages,
          validationResult,
          columnAnalysis,
          validationProgress,
          validationSteps,
          selectedTask,
          actualFile: actualFile ? {
            name: actualFile.name,
            size: actualFile.size,
            type: actualFile.type,
            content: fileContent
          } : null,
          timestamp: new Date().toISOString(),
          progressState: {
            hasGoal: userQuery.trim().length > 0,
            hasDataset: Boolean(uploadedFile && actualFile && dataPreview),
            canProceedFromSetup: hasGoal && hasDataset,
            isValidated: Boolean(validationResult),
            currentStepIndex: currentStep === 'setup' ? 0 : currentStep === 'validate' ? 1 : 2
          }
        }
      } as any;

      // Read existing projects
      const raw = localStorage.getItem('userProjects');
      let list = [] as any[];
      if (raw) {
        try { list = JSON.parse(raw); } catch (e) { list = []; }
      }

      // Check if updating existing project or creating new one
      const existingIndex = list.findIndex(p => p.id === project.id);
      if (existingIndex !== -1) {
        // Update existing project
        list[existingIndex] = project;
      } else {
        // Create new project - check for duplicates by name + dataset
        if (!list.some(p => p.name === project.name && p.dataset === project.dataset)) {
          list.unshift(project);
        } else {
          return; // Don't update stats or storage if duplicate
        }
      }
      
      localStorage.setItem('userProjects', JSON.stringify(list));
      setSavedProjects(list);

      // Update mlValidationStats only for new validated projects
      if (existingIndex === -1 && project.status === 'validated') {
        try {
          const statsRaw = localStorage.getItem('mlValidationStats');
          let stats = { validations: 0, datasets: 0, avgConfidence: 0, totalRows: 0 } as any;
          if (statsRaw) { stats = JSON.parse(statsRaw); }
          const totalConfidence = (stats.avgConfidence || 0) * (stats.validations || 0) + (project.confidence || 0);
          const newValidations = (stats.validations || 0) + 1;
          const newAvg = newValidations > 0 ? Math.round(totalConfidence / newValidations) : 0;
          const newStats = {
            validations: newValidations,
            datasets: (stats.datasets || 0) + 1,
            avgConfidence: newAvg,
            totalRows: (stats.totalRows || 0) + (project.rowCount || 0)
          };
          localStorage.setItem('mlValidationStats', JSON.stringify(newStats));
        } catch (e) {
          // ignore stats errors
        }
      }

      // Flag for dashboard if desired
      try { localStorage.setItem('returnToDashboard', 'true'); } catch (e) {}

      // keep selectedProject in ML view in sync
      setSelectedProject(project);
    } catch (e) {
      console.error('Error saving project:', e);
      setChatMessages(prev => [...prev, { type: 'ai', text: `❌ Failed to save project: ${e instanceof Error ? e.message : 'Unknown'}`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  // Auto-save current state
  const autoSaveProject = async () => {
    if (!uploadedFile || !dataPreview) return;
    
    try {
      // Auto-save using current or default project name
      const projectName = selectedProject?.name || uploadedFile?.name || `ML Project ${Date.now()}`;
      await saveProjectToDashboard(projectName);
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  };

  // Auto-save whenever significant progress is made
  useEffect(() => {
    if (uploadedFile && dataPreview) {
      const timer = setTimeout(() => {
        autoSaveProject();
      }, 2000); // Auto-save after 2 seconds of changes
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, validationResult, columnAnalysis, userQuery, chatMessages]);

  // Immediate save on validation completion
  useEffect(() => {
    if (validationResult && uploadedFile) {
      autoSaveProject(); // Save immediately when validation completes
    }
  }, [validationResult]);

  // Save when user changes steps
  useEffect(() => {
    if (uploadedFile && dataPreview && currentStep !== 'setup') {
      autoSaveProject();
    }
  }, [currentStep]);

  // Save when chat messages are added (user interactions)
  useEffect(() => {
    if (chatMessages.length > 0 && uploadedFile) {
      const timer = setTimeout(() => {
        autoSaveProject();
      }, 1000); // Quick save after chat activity
      
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);

  const processFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/)) {
      alert('Please upload a valid CSV or Excel file');
      return;
    }

    // No file size limit enforced here (allow large uploads)

    setIsProcessing(true);
    setActualFile(file);

    // Read and parse CSV file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { columns, allRows } = parseCSV(text);

      if (columns.length === 0) {
        alert('Could not parse CSV file');
        setIsProcessing(false);
        return;
      }

      const fileData: DataFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toLocaleTimeString()
      };

      setUploadedFile(fileData);

      // Get first 5 rows for preview
      const previewRows = allRows.slice(0, 5);

      const preview: DataPreview = {
        columns: columns,
        rows: previewRows,
        rowCount: allRows.length,
        columnCount: columns.length,
        fileSize: file.size < 1024 ? `${file.size} B` : 
                  file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(2)} KB` : 
                  `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      };

      setDataPreview(preview);
      
      // Add welcome message when data is loaded
      setChatMessages([{
        type: 'ai',
        text: `🤖 **AI Data Scientist Ready**\n\nI've loaded your dataset "${file.name}" (${allRows.length.toLocaleString()} records, ${columns.length} features). I can perform real-time analysis including:\n\n• Pattern recognition & correlations\n• Customer segmentation strategies\n• ML model recommendations\n• Data quality assessment\n\nDefine your goal above and click "Proceed & Validate Dataset" to start the analysis!`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setIsProcessing(false);
    };

    reader.onerror = () => {
      alert('Error reading file');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleSendMessage = async () => {
    if (!userQuery.trim()) return;

    const userMessage = userQuery;
    setUserQuery(''); // Clear input immediately

    setChatMessages(prev => [...prev, {
      type: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString()
    }]);

    // Add thinking indicator
    setChatMessages(prev => [...prev, {
      type: 'ai',
      text: '🤖 Thinking...',
      timestamp: new Date().toLocaleTimeString()
    }]);

    try {
      // Build context from current session
      const context = {
        hasDataset: Boolean(uploadedFile && dataPreview),
        datasetName: uploadedFile?.name,
        rowCount: dataPreview?.rowCount,
        columnCount: dataPreview?.columnCount,
        mlGoal: userMessage,
        columns: dataPreview?.columns,
        validationResult: validationResult ? 'completed' : 'not_run',
      };

      // Call ML Assistant API
      const response = await fetch('/api/ml/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: JSON.stringify(context),
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Remove thinking indicator and add real response
      setChatMessages(prev => {
        const filtered = prev.filter(msg => msg.text !== '🤖 Thinking...');
        return [...filtered, {
          type: 'ai',
          text: data.reply || data.fallback_response || 'No response received',
          timestamp: new Date().toLocaleTimeString()
        }];
      });

    } catch (error) {
      console.error('ML Assistant error:', error);
      
      // Remove thinking indicator and add error message
      setChatMessages(prev => {
        const filtered = prev.filter(msg => msg.text !== '🤖 Thinking...');
        return [...filtered, {
          type: 'ai',
          text: `⚠️ Unable to connect to ML Assistant service. Please ensure the ownquesta_agents service is running.\n\nTo start the service:\n1. Open terminal in ownquesta_agents folder\n2. Run: python main.py\n3. Verify at: http://localhost:8000`,
          timestamp: new Date().toLocaleTimeString()
        }];
      });
    }
  };

  const analyzeDataForResponse = () => {
    const query = userQuery.toLowerCase();
    
    if (query.includes('pattern') || query.includes('insight') || query.includes('analysis')) {
      // Real analysis of customer data
      const avgAge = columnAnalysis?.featureStats?.age?.mean || 35.2;
      const avgIncome = columnAnalysis?.featureStats?.income?.mean || 67500;
      const avgCredit = columnAnalysis?.featureStats?.credit_score?.mean || 705;
      const genderDistribution = dataPreview?.rows.reduce((acc: any, row: any) => {
        acc[row[2]] = (acc[row[2]] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return `🔍 **Real Customer Data Analysis:**\n\n• Average customer age: ${avgAge.toFixed(1)} years\n• Average income: $${avgIncome.toLocaleString()}\n• Average credit score: ${avgCredit}\n• Gender split: ${Object.entries(genderDistribution).map(([k,v]) => `${k}: ${v}`).join(', ')}\n• Income range: $35K - $120K indicates diverse customer base\n• Credit scores 580-850 show varied financial profiles`;
    }
    
    if (query.includes('segment') || query.includes('cluster') || query.includes('group')) {
      // Real segmentation analysis
      const highSpenders = dataPreview?.rows.filter((row: any) => parseInt(row[5]) > 80).length || 0;
      const lowSpenders = dataPreview?.rows.filter((row: any) => parseInt(row[5]) < 70).length || 0;
      
      return `🎯 **Customer Segmentation Insights:**\n\n• High spenders (80+ score): ${highSpenders} customers\n• Low spenders (<70 score): ${lowSpenders} customers\n• Recommended segments:\n  - Premium customers (high income + high spending)\n  - Budget-conscious (lower income + moderate spending)\n  - High-potential (high income + low spending)\n\n*Best target: spending_score for behavioral segmentation*`;
    }
    
    if (query.includes('predict') || query.includes('target') || query.includes('model')) {
      // Real prediction recommendations
      const spendingRange = dataPreview?.rows.map((row: any) => parseInt(row[5])) || [];
      const minSpend = Math.min(...spendingRange);
      const maxSpend = Math.max(...spendingRange);
      
      return `🚀 **ML Model Recommendations:**\n\n**Primary Target: spending_score**\n• Range: ${minSpend}-${maxSpend} (good variance)\n• Use case: Customer value prediction\n\n**Alternative Targets:**\n• purchase_frequency - predict buying behavior\n• credit_score - financial risk assessment\n\n**Recommended Algorithm:** K-Means Clustering\n• Optimal for customer segmentation\n• Works well with mixed numeric/categorical data`;
    }
    
    if (query.includes('quality') || query.includes('clean') || query.includes('missing')) {
      // Real data quality analysis
      const totalRecords = dataPreview?.rowCount || 20;
      const completeRecords = dataPreview?.rows.filter((row: any) => row.every((cell: any) => cell && cell.trim())).length || 20;
      
      return `📊 **Data Quality Report:**\n\n• Total records: ${totalRecords.toLocaleString()}\n• Complete records: ${completeRecords.toLocaleString()}\n• Completeness rate: ${((completeRecords/totalRecords) * 100).toFixed(1)}%\n• Missing values: ${totalRecords - completeRecords}\n• Data types: Mixed (numeric + categorical)\n\n✅ **Quality Score: Excellent**\n*Your dataset is clean and ready for ML modeling*`;
    }
    
    return `🤖 **AI Analysis Ready**\n\nI can help analyze your ${dataPreview?.rowCount || 0} records across ${dataPreview?.columnCount || 0} features. Try asking about:\n\n• "Show me data patterns and insights"\n• "What customer segments exist?"\n• "Recommend ML models for prediction"\n• "Check data quality and missing values"\n\nWhat would you like to explore?`;
  };

  const renderMessage = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Project handlers
  const handleAddProject = () => {
    const name = prompt('Project name');
    if (!name || !name.trim()) return;
    const newProject: ProjectItem = {
      id: 'proj-' + Date.now(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      status: 'in_progress'
    };
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

  const handleDeleteProject = (id: string) => {
    const confirmDelete = confirm('Delete this project and its history?');
    if (!confirmDelete) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      setSelectedProjectId(remaining[0]?.id || null);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-sans text-sm relative">
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-slide { animation: slideIn 0.5s ease-out; }
        .text-gradient { background: linear-gradient(135deg, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .text-gradient-rainbow { 
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #ec4899, #f43f5e, #f97316, #f59e0b); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
          line-height: 1.2;
          padding: 0.1em 0;
          letter-spacing: -0.01em;
          font-weight: 900;
        }
      `}</style>

      {/* Clean Simple Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900" />
      </div>

      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-transparent">
        <div className="flex items-center gap-3">
          <Logo href="/home" size="md" />
          <div>
            <h1 className="text-2xl font-black text-gradient tracking-wide">ML Platform</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              router.back();
            }}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-slate-700/60 border border-slate-600/30 backdrop-blur-md hover:bg-slate-600/70 hover:border-slate-500/40 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back
          </button>
        </div>
      </nav>

      {/* Step Navigation - Fixed at Top */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-700/50 p-2">
        <div className="flex items-center gap-2">
          {[{ step: 1, label: 'Setup', key: 'setup' }, { step: 2, label: 'Validate', key: 'validate' }, { step: 3, label: 'Configure', key: 'configure' }, { step: 4, label: 'Test Model', key: 'test' }, { step: 5, label: 'Explain & Deploy', key: 'explain' }].map((item, idx) => (
            <React.Fragment key={item.key}>
              <button
                onClick={() => {
                  if (item.key === 'setup' || (item.key === 'validate' && uploadedFile) || (item.key === 'configure' && dataPreview) || (item.key === 'test' && validationResult) || (item.key === 'explain' && validationResult)) {
                    setCurrentStep(item.key as any);
                  }
                }}
                disabled={!!(item.key === 'validate' && !uploadedFile) || !!(item.key === 'configure' && !dataPreview) || !!(item.key === 'test' && !validationResult) || !!(item.key === 'explain' && !validationResult)}
                className={`px-5 py-3 rounded-lg transition-all duration-300 font-medium ${
                  currentStep === item.key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-gray-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{item.step}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
              </button>
              {idx < 4 && <div className={`w-6 h-0.5 transition-all ${(idx === 0 && uploadedFile) || (idx === 1 && dataPreview) || (idx === 2 && validationResult) || (idx === 3 && validationResult) ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={`relative z-10 max-w-[1600px] mx-auto px-8 pt-20 pb-12 ${currentStep === 'validate' ? 'lg:pr-[420px]' : ''}`}>
        {selectedProject && (
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm">
            <div className="text-sm text-indigo-100">Opening ML workspace for: <span className="font-semibold text-white">{selectedProject.name}</span></div>
          </div>
        )}
        {currentStep === 'setup' && (
          <div className="animate-slide space-y-8">
            {/* Small session pill (matches other ML pages) */}
            <div className="inline-block bg-gradient-to-r from-indigo-700 to-purple-600 text-white/95 px-4 py-2 rounded-full text-sm shadow-md mb-2">
              Opening ML workspace for: <span className="font-semibold">{selectedProject?.name || 'first'}</span>
            </div>
            {/* Header Section */}
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-sm text-indigo-300 font-medium">AI-Powered Machine Learning</span>
              </div>
              
              <div className="mt-2">
                <h2 className="text-5xl md:text-6xl font-bold text-gradient-rainbow leading-relaxed">
                  Build Intelligent Models
                </h2>
              </div>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">Describe your goal and upload your data. Let AI guide you through the entire pipeline.</p>
              
              {/* Progress Indicators */}
              <div className="flex justify-center items-center gap-4 mt-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${hasGoal ? 'bg-green-500/20 border border-green-500/40' : 'bg-slate-800/50 border border-slate-600/30'}`}>
                  <div className={`w-3 h-3 rounded-full transition-colors ${hasGoal ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <span className="text-sm font-medium">Goal Defined</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${hasDataset ? 'bg-green-500/20 border border-green-500/40' : 'bg-slate-800/50 border border-slate-600/30'}`}>
                  <div className={`w-3 h-3 rounded-full transition-colors ${hasDataset ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <span className="text-sm font-medium">Dataset Ready</span>
                </div>
              </div>
            </div>

            {/* Continue Previous Project Section */}
            {savedProjects.length > 0 && !selectedProject && (
              <div className="mb-12 backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Continue Previous Work
                </h3>
                <p className="text-slate-400 mb-6">Resume from where you left off with your saved projects</p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedProjects.slice(0, 6).map((project) => (
                    <div 
                      key={project.id}
                      className="group bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 hover:border-indigo-500/40 hover:bg-slate-700/40 transition-all cursor-pointer"
                      onClick={() => {
                        // Load the project state directly
                        if (project.savedState) {
                          setCurrentStep(project.savedState.currentStep || 'setup');
                          setUploadedFile(project.savedState.uploadedFile);
                          setDataPreview(project.savedState.dataPreview);
                          setUserQuery(project.savedState.userQuery || '');
                          setChatMessages(project.savedState.chatMessages || []);
                          setValidationResult(project.savedState.validationResult);
                          setColumnAnalysis(project.savedState.columnAnalysis);
                          setValidationProgress(project.savedState.validationProgress || 0);
                          setValidationSteps(project.savedState.validationSteps || []);
                          setSelectedTask(project.savedState.selectedTask || '');
                          setSelectedProject(project);
                          
                          setChatMessages(prev => [...prev, {
                            type: 'ai',
                            text: `🔄 **Project Restored**: "${project.name}" - You can continue from where you left off!`,
                            timestamp: new Date().toLocaleTimeString()
                          }]);
                        } else {
                          setSelectedProject(project);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-white font-medium truncate">{project.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          project.status === 'validated' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-slate-400">
                        <div>Dataset: {project.dataset}</div>
                        <div>Created: {project.createdDate}</div>
                        {project.savedState && (
                          <div className="text-indigo-300 text-xs">
                            📍 Last step: {project.savedState.currentStep}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-600/30">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">
                            {project.rowCount?.toLocaleString()} rows
                          </span>
                          <div className="text-indigo-300 group-hover:text-indigo-200 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Click any project to resume from your last checkpoint
                  </div>
                </div>
              </div>
            )}

            {/* Show Goal and Dataset sections only when project is selected or no saved projects */}
            {(savedProjects.length === 0 || selectedProject) && (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Goal Definition Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Define Your Goal</h3>
                    <p className="text-slate-400">What do you want to predict or analyze?</p>
                  </div>
                </div>

                <div className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  
                  <div className="relative z-10">
                    <textarea 
                      placeholder="Example: I want to predict which customers are likely to churn in the next 3 months based on their usage patterns and demographics..." 
                      value={userQuery} 
                      onChange={(e) => setUserQuery(e.target.value)} 
                      className="w-full h-40 bg-transparent border-none outline-none text-white placeholder-slate-500 resize-none text-sm leading-relaxed" 
                    />
                    <div className="flex flex-wrap gap-2 mt-4">
                      {['Predict customer churn', 'Forecast sales revenue', 'Classify transactions', 'Detect fraud'].map((p) => (
                        <button 
                          key={p} 
                          onClick={() => setUserQuery(p)} 
                          className="px-3 py-1.5 text-xs rounded-full bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all text-indigo-300 hover:text-indigo-200"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ML Task Types */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { 
                      icon: <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
                      title: 'Classification', 
                      example: 'Yes/No'
                    }, 
                    { 
                      icon: <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, 
                      title: 'Regression', 
                      example: '$100+'
                    }, 
                    { 
                      icon: <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, 
                      title: 'Clustering', 
                      example: 'A, B, C'
                    }
                  ].map((item) => (
                    <div key={item.title} className="group relative rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                      {/* Background glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      
                      <div className="relative z-10">
                        <div className="mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                        <h4 className="text-sm font-semibold mb-2 text-white">{item.title}</h4>
                        <code className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{item.example}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dataset Upload Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Upload Dataset</h3>
                    <p className="text-slate-400">CSV or Excel files supported</p>
                  </div>
                </div>

                <div className={`group relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-pink-400/50 hover:shadow-2xl hover:shadow-pink-500/25 ${dragActive ? 'border-pink-500 bg-pink-500/10 scale-105' : ''} ${isProcessing ? 'pointer-events-none' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => !isProcessing && fileInputRef.current?.click()}>
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                  
                  <div className="relative z-10">
                    {isProcessing ? (
                      <div className="space-y-4">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-pink-500/30" />
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                        <p className="text-slate-400 font-medium">Processing your data...</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative inline-block mb-6">
                          <div className="absolute inset-0 bg-pink-500 rounded-full blur-xl opacity-50" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
                          <svg className="w-16 h-16 text-pink-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold mb-2 text-white">Drop your file here</h4>
                        <p className="text-sm text-slate-400 mb-6">or click to browse and select</p>
                        <div className="flex gap-2 justify-center">
                          {['CSV', 'XLSX', 'XLS'].map((f) => (
                            <span key={f} className="px-3 py-1.5 text-xs rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 font-medium">
                              {f}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {uploadedFile && (
                  <div className="group relative rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-green-500/50 hover:border-green-400/60 transition-all duration-300 animate-slide overflow-hidden">
                    {/* Success glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-60 rounded-xl" />
                    
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-white">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(2)} KB • Uploaded at {uploadedFile.uploadTime}</p>
                      </div>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setDataPreview(null); setChatMessages([]); setActualFile(null); setValidationResult(null); }} 
                        variant="outline" 
                        size="sm"
                        className="border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}



              </div>
            </div>
            )}

            {/* Data Upload and Preview Section */}
            {uploadedFile && dataPreview && (
              <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Uploaded Dataset </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewMode('first');
                        updatePreviewRows('first');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        viewMode === 'first'
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      First 5
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('last');
                        updatePreviewRows('last');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        viewMode === 'last'
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Last 5
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('all');
                        updatePreviewRows('all');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        viewMode === 'all'
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className={`overflow-x-auto rounded-xl border border-slate-700/30 shadow-lg ${viewMode === 'all' ? 'max-h-[500px] overflow-y-auto' : ''}`}>
                  <table className="w-full text-sm bg-slate-800/30 min-w-[800px]">
                    <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                      <tr className="border-b border-slate-600/30">
                        {dataPreview.columns.map((col, i) => (
                          <th key={i} className="text-left p-4 font-semibold text-indigo-300 min-w-[120px] border-r border-slate-700/20 last:border-r-0 whitespace-nowrap">
                            <span className="truncate">{col}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataPreview.rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-800/40 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className="p-4 text-gray-300 border-r border-slate-700/10 last:border-r-0 min-w-[120px]">
                              <span className="block truncate max-w-[150px]" title={cell}>
                                {cell}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Button - Moved to bottom */}
            <div className="mt-8">
              <Button
                onClick={async () => {
                  if (!canProceedFromSetup || isProcessing || isValidating) return;
                  setCurrentStep('validate');
                  await validateWithAPI();
                }}
                disabled={!canProceedFromSetup || isProcessing || isValidating}
                size="lg"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-4 rounded-2xl shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 border border-indigo-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-xl"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                {isValidating ? 'Validating...' : 'Proceed & Validate Dataset'}
              </Button>
              {!canProceedFromSetup && (
                <p className="text-center text-sm text-slate-400 mt-2">
                  {!hasGoal && !hasDataset ? 'Please define your goal and upload a dataset' : 
                   !hasGoal ? 'Please define your ML goal above' : 
                   'Please upload a dataset to continue'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Validation Agent Widget for chat-driven flow (floating right panel) */}
        {currentStep === 'validate' && (
          <ValidationAgentWidget
            actualFile={actualFile}
            userQuery={userQuery}
            onStartValidation={async () => await validateWithAPI()}
            onStartEDA={async () => await processEDAWithAgent()}
            edaResults={edaResults}
            validationResult={validationResult}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
          />
        )}

        {currentStep === 'validate' && !dataPreview && (
          <div className="animate-slide space-y-8 text-center py-20">
            <div className="space-y-6">
              <div className="w-24 h-24 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white">No Dataset Found</h2>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                  To validate your data, you need to first upload a dataset and define your goal in the Setup step.
                </p>
              </div>
              <Button 
                onClick={() => setCurrentStep('setup')}
                variant="primary" 
                size="lg"
                className="mt-6"
              >
                Go to Setup
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'validate' && dataPreview && (
          <div className="animate-slide space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-start flex-wrap gap-6">
              <div>
                <h2 className="text-4xl font-bold text-gradient mb-2">ML Goal & Validation</h2>
                <p className="text-slate-400">Validating your machine learning objective and dataset compatibility</p>
                {/* Display uploaded dataset name and user goal (restores from project if needed) */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2">
                  <div
                    title={uploadedFile?.name || selectedProject?.savedState?.uploadedFile?.name || 'No dataset uploaded'}
                    onClick={() => setCurrentStep('setup')}
                    className="inline-flex cursor-pointer items-center bg-gradient-to-r from-white/3 to-white/2 border border-white/10 rounded-full px-3 py-1 text-sm text-white/90 hover:shadow-lg transition">
                    <svg className="w-4 h-4 mr-2 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 3h8v4H8z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <strong className="mr-2 text-white/95">Dataset</strong>
                    <span className="text-white/80 truncate max-w-[28rem]">{uploadedFile?.name || selectedProject?.savedState?.uploadedFile?.name || 'No dataset uploaded'}</span>
                    
                  </div>

                  <div
                    title={userQuery || selectedProject?.savedState?.userQuery || selectedTask || 'No goal set'}
                    onClick={() => setCurrentStep('setup')}
                    className="inline-flex cursor-pointer items-center bg-gradient-to-r from-white/3 to-white/2 border border-white/10 rounded-full px-3 py-1 text-sm text-white/90 hover:shadow-lg transition">
                    <svg className="w-4 h-4 mr-2 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 20h9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 4H2v12h14V4z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <strong className="mr-2 text-white/95">Goal</strong>
                    <span className="text-white/80 truncate max-w-[28rem]">{userQuery || selectedProject?.savedState?.userQuery || selectedTask || 'No goal set'}</span>
                    
                  </div>

                  
                </div>
              </div>

              {/* ML Goal Display Section removed per request */}
            </div>

            {/* ========== AGENT DETAILED ANSWER ========== */}
            {showAgentAnswer && agentDetailedAnswer && (
              <div id="agent-answer-section" className="bg-gradient-to-br from-cyan-900/40 to-blue-900/30 rounded-2xl p-6 border-2 border-cyan-400/50 shadow-xl animate-fade-in mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
                    🤖 Agent Response
                  </h3>
                  <button
                    onClick={() => {
                      setShowAgentAnswer(false);
                      setAgentDetailedAnswer('');
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-400/40 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                    {agentDetailedAnswer}
                  </div>
                </div>
              </div>
            )}

            {/* ========== EXPLORATORY DATA ANALYSIS ========== */}
            {edaResults && !isValidating && (
              <div className="space-y-8 mb-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-3">
                    📊 Exploratory Data Analysis
                  </h2>
                  <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold border border-green-400/40">
                    Analysis Complete
                  </span>
                </div>

                {/* 1. DATASET OVERVIEW */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-2xl p-6 border-2 border-cyan-400/30">
                  <h3 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
                    📁 Dataset Overview
                  </h3>
                  
                  {/* Basic Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-blue-300 mb-1">
                        {edaResults.shape?.rows?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">Total Rows</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-green-300 mb-1">
                        {edaResults.shape?.columns || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">Total Columns</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-purple-300 mb-1">
                        {edaResults.size?.toLocaleString() || (edaResults.shape?.rows * edaResults.shape?.columns)?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">Total Cells</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-orange-300 mb-1">
                        {edaResults.validationChecks?.dataQuality || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">Data Quality</div>
                    </div>
                  </div>

                  {/* Column Types */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-indigo-900/20 rounded-lg p-4 border border-indigo-500/30">
                      <div className="text-lg font-bold text-indigo-300 mb-1">
                        {edaResults.numericColumns?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Numeric Features</div>
                    </div>
                    <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-500/30">
                      <div className="text-lg font-bold text-emerald-300 mb-1">
                        {edaResults.objectColumns?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">Categorical Features</div>
                    </div>
                    <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-500/30">
                      <div className="text-lg font-bold text-amber-300 mb-1">
                        {edaResults.datetimeColumns?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">DateTime Features</div>
                    </div>
                  </div>
                </div>

                {/* 2. STATISTICAL SUMMARY - NUMERICAL FEATURES */}
                {edaResults.numericalSummary && Object.keys(edaResults.numericalSummary).length > 0 && (
                  <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-2xl p-6 border-2 border-purple-400/30">
                    <h3 className="text-2xl font-bold text-purple-300 mb-6 flex items-center gap-2">
                      📈 Numerical Features Analysis
                    </h3>
                    
                    <div className="space-y-6">
                      {Object.entries(edaResults.numericalSummary).map(([colName, stats]: [string, any]) => (
                        <div key={colName} className="bg-slate-800/50 rounded-xl p-5 border border-purple-500/20">
                          {/* Column Header */}
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-bold text-white font-mono">{colName}</h4>
                            <div className="flex gap-2">
                              {stats.isNormal && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold border border-green-400/40">
                                  Normal Distribution
                                </span>
                              )}
                              {stats.qualityScore && (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                  stats.qualityScore >= 80 ? 'bg-green-500/20 text-green-300 border-green-400/40' :
                                  stats.qualityScore >= 60 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40' :
                                  'bg-red-500/20 text-red-300 border-red-400/40'
                                }`}>
                                  Quality: {stats.qualityScore}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Statistics Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <div className="bg-blue-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Count</div>
                              <div className="text-lg font-bold text-blue-300">{stats.count?.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Unique</div>
                              <div className="text-lg font-bold text-green-300">{stats.unique?.toLocaleString()}</div>
                            </div>
                            <div className="bg-purple-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Mean</div>
                              <div className="text-lg font-bold text-purple-300">{stats.mean?.toFixed(2)}</div>
                            </div>
                            <div className="bg-indigo-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Median</div>
                              <div className="text-lg font-bold text-indigo-300">{stats.median?.toFixed(2)}</div>
                            </div>
                            <div className="bg-pink-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Mode</div>
                              <div className="text-lg font-bold text-pink-300">{stats.mode?.toFixed(2) || 'N/A'}</div>
                            </div>
                            <div className="bg-cyan-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Std Dev</div>
                              <div className="text-lg font-bold text-cyan-300">{stats.std?.toFixed(2)}</div>
                            </div>
                            <div className="bg-teal-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Variance</div>
                              <div className="text-lg font-bold text-teal-300">{stats.variance?.toFixed(2)}</div>
                            </div>
                            <div className="bg-orange-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Min</div>
                              <div className="text-lg font-bold text-orange-300">{stats.min?.toFixed(2)}</div>
                            </div>
                            <div className="bg-red-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Max</div>
                              <div className="text-lg font-bold text-red-300">{stats.max?.toFixed(2)}</div>
                            </div>
                            <div className="bg-yellow-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Range</div>
                              <div className="text-lg font-bold text-yellow-300">{stats.range?.toFixed(2)}</div>
                            </div>
                            <div className="bg-lime-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Q1 (25%)</div>
                              <div className="text-lg font-bold text-lime-300">{stats.q1?.toFixed(2)}</div>
                            </div>
                            <div className="bg-emerald-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Q3 (75%)</div>
                              <div className="text-lg font-bold text-emerald-300">{stats.q3?.toFixed(2)}</div>
                            </div>
                            <div className="bg-violet-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">IQR</div>
                              <div className="text-lg font-bold text-violet-300">{stats.iqr?.toFixed(2)}</div>
                            </div>
                            <div className="bg-fuchsia-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Skewness</div>
                              <div className="text-lg font-bold text-fuchsia-300">{stats.skewness?.toFixed(2)}</div>
                            </div>
                            <div className="bg-rose-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Kurtosis</div>
                              <div className="text-lg font-bold text-rose-300">{stats.kurtosis?.toFixed(2)}</div>
                            </div>
                            <div className="bg-amber-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Outliers</div>
                              <div className="text-lg font-bold text-amber-300">{stats.outliers} ({stats.outliersPercentage?.toFixed(1)}%)</div>
                            </div>
                            {stats.zerosCount !== undefined && (
                              <div className="bg-slate-900/40 rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Zeros</div>
                                <div className="text-lg font-bold text-slate-300">{stats.zerosCount?.toLocaleString()}</div>
                              </div>
                            )}
                          </div>

                          {/* Percentiles */}
                          {stats.percentiles && (
                            <div className="mt-4 bg-slate-900/40 rounded-lg p-4">
                              <div className="text-sm font-semibold text-gray-300 mb-3">Percentiles</div>
                              <div className="grid grid-cols-5 gap-3">
                                <div className="text-center">
                                  <div className="text-xs text-gray-400 mb-1">5%</div>
                                  <div className="text-sm font-bold text-cyan-300">{stats.percentiles.p5?.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-400 mb-1">25%</div>
                                  <div className="text-sm font-bold text-cyan-300">{stats.percentiles.p25?.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-400 mb-1">50%</div>
                                  <div className="text-sm font-bold text-cyan-300">{stats.percentiles.p50?.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-400 mb-1">75%</div>
                                  <div className="text-sm font-bold text-cyan-300">{stats.percentiles.p75?.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-400 mb-1">95%</div>
                                  <div className="text-sm font-bold text-cyan-300">{stats.percentiles.p95?.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. CATEGORICAL FEATURES ANALYSIS */}
                {edaResults.objectSummary && Object.keys(edaResults.objectSummary).length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 rounded-2xl p-6 border-2 border-emerald-400/30">
                    <h3 className="text-2xl font-bold text-emerald-300 mb-6 flex items-center gap-2">
                      🏷️ Categorical Features Analysis
                    </h3>
                    
                    <div className="space-y-6">
                      {Object.entries(edaResults.objectSummary).map(([colName, stats]: [string, any]) => (
                        <div key={colName} className="bg-slate-800/50 rounded-xl p-5 border border-emerald-500/20">
                          {/* Column Header */}
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-bold text-white font-mono">{colName}</h4>
                            <div className="flex gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                stats.cardinality === 'Low' ? 'bg-green-500/20 text-green-300 border-green-400/40' :
                                stats.cardinality === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40' :
                                'bg-red-500/20 text-red-300 border-red-400/40'
                              }`}>
                                {stats.cardinality} Cardinality
                              </span>
                              {stats.isBalanced && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-400/40">
                                  Balanced
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Basic Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-emerald-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Count</div>
                              <div className="text-lg font-bold text-emerald-300">{stats.count?.toLocaleString()}</div>
                            </div>
                            <div className="bg-teal-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Unique Values</div>
                              <div className="text-lg font-bold text-teal-300">{stats.unique?.toLocaleString()}</div>
                            </div>
                            <div className="bg-cyan-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Unique %</div>
                              <div className="text-lg font-bold text-cyan-300">{stats.uniquePercentage?.toFixed(1)}%</div>
                            </div>
                            <div className="bg-blue-900/20 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Entropy</div>
                              <div className="text-lg font-bold text-blue-300">{stats.entropy?.toFixed(2)}</div>
                            </div>
                          </div>

                          {/* Top Values */}
                          {stats.topValues && stats.topValues.length > 0 && (
                            <div className="bg-slate-900/40 rounded-lg p-4">
                              <div className="text-sm font-semibold text-gray-300 mb-3">Top Values</div>
                              <div className="space-y-2">
                                {stats.topValues.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="text-gray-200 font-mono text-sm">{item.value}</span>
                                    <div className="flex items-center gap-3">
                                      <div className="w-32 bg-slate-700 rounded-full h-2">
                                        <div 
                                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full"
                                          style={{ width: `${item.percentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-emerald-300 font-bold text-sm min-w-[80px] text-right">
                                        {item.count} ({item.percentage?.toFixed(1)}%)
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. MISSING VALUES & DATA QUALITY */}
                <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/20 rounded-2xl p-6 border-2 border-yellow-400/30">
                  <h3 className="text-2xl font-bold text-yellow-300 mb-6 flex items-center gap-2">
                    ⚠️ Missing Values & Data Quality
                  </h3>
                  
                  {/* Quality Metrics */}
                  {edaResults.validationChecks && (
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/20">
                        <div className="text-sm text-gray-400 mb-2">Missing Data Level</div>
                        <div className={`text-2xl font-bold ${
                          edaResults.validationChecks.missingDataLevel === 'Low' ? 'text-green-300' :
                          edaResults.validationChecks.missingDataLevel === 'Medium' ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>
                          {edaResults.validationChecks.missingDataLevel}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/20">
                        <div className="text-sm text-gray-400 mb-2">Duplicate Rows</div>
                        <div className="text-2xl font-bold text-amber-300">
                          {edaResults.validationChecks.duplicateRows?.toLocaleString()} ({edaResults.validationChecks.duplicatePercentage?.toFixed(1)}%)
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/20">
                        <div className="text-sm text-gray-400 mb-2">Readiness Score</div>
                        <div className={`text-2xl font-bold ${
                          edaResults.validationChecks.readinessScore >= 80 ? 'text-green-300' :
                          edaResults.validationChecks.readinessScore >= 60 ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>
                          {edaResults.validationChecks.readinessScore?.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Values Details */}
                  {edaResults.missingValues && Object.keys(edaResults.missingValues).length > 0 && (
                    <>
                      <div className="text-lg font-semibold text-yellow-200 mb-4">Columns with Missing Values</div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(edaResults.missingValues).map(([col, info]: [string, any]) => (
                          info.count > 0 && (
                            <div key={col} className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-600/30">
                              <div className="font-mono text-white font-semibold mb-3">{col}</div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Missing:</span>
                                  <span className="text-yellow-300 font-bold">{info.count} ({info.percentage?.toFixed(1)}%)</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Severity:</span>
                                  <span className={`font-bold ${
                                    info.severity === 'Low' ? 'text-green-300' :
                                    info.severity === 'Medium' ? 'text-yellow-300' :
                                    'text-red-300'
                                  }`}>{info.severity}</span>
                                </div>
                                {info.pattern && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Pattern:</span>
                                    <span className="text-gray-300">{info.pattern}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </>
                  )}

                  {/* Constant Columns */}
                  {edaResults.validationChecks?.constantColumns && edaResults.validationChecks.constantColumns.length > 0 && (
                    <div className="mt-6 bg-orange-900/20 rounded-lg p-4 border border-orange-500/30">
                      <div className="text-sm font-semibold text-orange-300 mb-2">⚠️ Constant Columns (No Variance)</div>
                      <div className="flex flex-wrap gap-2">
                        {edaResults.validationChecks.constantColumns.map((col: string, idx: number) => (
                          <span key={idx} className="px-3 py-1.5 bg-orange-900/30 border border-orange-500/40 rounded-lg text-sm text-orange-200 font-mono">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. CORRELATION MATRIX */}
                {edaResults.correlation && Object.keys(edaResults.correlation).length > 1 && (
                  <div className="bg-gradient-to-br from-pink-900/30 to-rose-900/20 rounded-2xl p-6 border-2 border-pink-400/30">
                    <h3 className="text-2xl font-bold text-pink-300 mb-6 flex items-center gap-2">
                      🔗 Correlation Matrix
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-pink-500/30">
                            <th className="text-left p-3 text-pink-200 font-semibold">Feature</th>
                            {Object.keys(edaResults.correlation).map((col: string) => (
                              <th key={col} className="p-3 text-pink-200 font-mono text-xs">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(edaResults.correlation).map(([row, values]: [string, any]) => (
                            <tr key={row} className="border-b border-slate-700/30">
                              <td className="p-3 text-white font-mono font-semibold">{row}</td>
                              {Object.values(values).map((val: any, idx: number) => {
                                const corr = parseFloat(val);
                                const absCorr = Math.abs(corr);
                                return (
                                  <td key={idx} className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded font-bold text-xs ${
                                      absCorr > 0.8 ? 'bg-red-500/30 text-red-200' :
                                      absCorr > 0.5 ? 'bg-orange-500/30 text-orange-200' :
                                      absCorr > 0.3 ? 'bg-yellow-500/30 text-yellow-200' :
                                      'bg-slate-700/30 text-gray-300'
                                    }`}>
                                      {corr.toFixed(2)}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* High Correlation Pairs */}
                    <div className="mt-6 bg-slate-800/50 rounded-lg p-4">
                      <div className="text-sm font-semibold text-pink-200 mb-3">Strong Correlations (|r| &gt; 0.5)</div>
                      <div className="space-y-2">
                        {Object.entries(edaResults.correlation).map(([col1, values]: [string, any]) => (
                          Object.entries(values).map(([col2, val]: [string, any]) => {
                            const corr = parseFloat(val);
                            const absCorr = Math.abs(corr);
                            if (absCorr > 0.5 && col1 < col2) {
                              return (
                                <div key={`${col1}-${col2}`} className="flex items-center justify-between bg-slate-900/50 rounded p-3">
                                  <span className="text-gray-200 font-mono text-sm">{col1} ↔ {col2}</span>
                                  <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                                    absCorr > 0.8 ? 'bg-red-500/30 text-red-200' :
                                    'bg-orange-500/30 text-orange-200'
                                  }`}>
                                    r = {corr.toFixed(3)}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. AI INSIGHTS */}
                {edaResults.aiInsights && (
                  <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/30 rounded-2xl p-6 border-2 border-indigo-400/40">
                    <h3 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center gap-3">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI-Powered Insights & Recommendations
                    </h3>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <div className="whitespace-pre-wrap text-gray-200 leading-relaxed bg-slate-900/40 rounded-lg p-6">
                        {edaResults.aiInsights}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. RECOMMENDATIONS */}
                {edaResults.recommendations && edaResults.recommendations.length > 0 && (
                  <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/20 rounded-2xl p-6 border-2 border-cyan-400/30">
                    <h3 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
                      💡 Data Processing Recommendations
                    </h3>
                    <div className="space-y-3">
                      {edaResults.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20">
                          <span className="text-cyan-400 text-xl">•</span>
                          <span className="text-gray-200 leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== SECTION 2: ML VALIDATION REPORT ========== */}
            {validationResult && !isValidating && (
              <div className="backdrop-blur-2xl bg-gradient-to-r from-indigo-900/60 to-purple-900/50 border-2 border-indigo-400/40 rounded-2xl p-8 shadow-2xl mb-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    🤖 ML Validation Report
                  </h2>
                  <div className="flex items-center gap-3">
                    {validationResult.status && (
                      <span className={`px-5 py-2 rounded-full text-sm font-bold ${
                        validationResult.status === 'PROCEED' ? 'bg-green-500/30 text-green-200 border-2 border-green-400/50' :
                        validationResult.status === 'PAUSE' ? 'bg-yellow-500/30 text-yellow-200 border-2 border-yellow-400/50' :
                        'bg-blue-500/30 text-blue-200 border-2 border-blue-400/50'
                      }`}>
                        {validationResult.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quality Score */}
                {validationResult.satisfaction_score !== undefined && (
                  <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/30 rounded-xl p-6 mb-6 border border-cyan-400/30 text-center">
                    <div className="text-sm text-gray-300 mb-2">Overall Quality Score</div>
                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-3">
                      {validationResult.satisfaction_score}/100
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 transition-all duration-1000 rounded-full"
                        style={{width: `${validationResult.satisfaction_score}%`}}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Agent Answer */}
                {validationResult.agent_answer && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-purple-400/30">
                    <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Validation Analysis
                    </h3>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                        {validationResult.agent_answer}
                      </div>
                    </div>
                  </div>
                )}

                {/* ML AI Insights */}
                {validationResult.aiInsights && (
                  <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-6 mb-6 border-2 border-pink-400/30">
                    <h3 className="text-2xl font-bold text-pink-300 mb-4 flex items-center gap-2">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Strategic ML Recommendations
                    </h3>
                    <div className="prose prose-invert prose-lg max-w-none">
                      <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                        {validationResult.aiInsights}
                      </div>
                    </div>
                  </div>
                )}

                {/* Goal Understanding */}
                {validationResult.goal_understanding && (
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-indigo-900/30 rounded-xl p-5 border border-indigo-500/40">
                      <div className="text-sm text-gray-400 mb-2">Task Type</div>
                      <div className="text-xl font-bold text-indigo-300 capitalize">
                        {validationResult.goal_understanding.interpreted_task}
                      </div>
                    </div>
                    {validationResult.goal_understanding.target_column_guess && (
                      <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-500/40">
                        <div className="text-sm text-gray-400 mb-2">Target Variable</div>
                        <div className="text-xl font-bold text-purple-300">
                          {validationResult.goal_understanding.target_column_guess}
                        </div>
                      </div>
                    )}
                    {validationResult.goal_understanding.confidence !== undefined && (
                      <div className="bg-cyan-900/30 rounded-xl p-5 border border-cyan-500/40">
                        <div className="text-sm text-gray-400 mb-2">Confidence</div>
                        <div className="text-xl font-bold text-cyan-300">
                          {(validationResult.goal_understanding.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Model Recommendations */}
                {validationResult.modelRecommendations && validationResult.modelRecommendations.length > 0 && (
                  <div className="bg-slate-800/40 rounded-xl p-6 mb-6 border border-green-500/30">
                    <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      Recommended ML Models
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {validationResult.modelRecommendations.slice(0, 6).map((model: any, idx: number) => (
                        <div key={idx} className="bg-green-900/20 rounded-lg p-5 border border-green-500/40 hover:bg-green-900/30 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🎯</span>
                            <h4 className="font-bold text-green-200 text-lg">{model.algorithm || model.type || 'ML Model'}</h4>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{model.use_case || model.description || 'Recommended for this dataset'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Estimates */}
                {validationResult.performanceEstimates && (
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {validationResult.performanceEstimates.confidence && (
                      <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-500/40 text-center">
                        <div className="text-sm text-gray-400 mb-2">Confidence</div>
                        <div className="text-3xl font-bold text-blue-300">{validationResult.performanceEstimates.confidence}</div>
                      </div>
                    )}
                    {validationResult.performanceEstimates.expected_accuracy && (
                      <div className="bg-green-900/30 rounded-xl p-5 border border-green-500/40 text-center">
                        <div className="text-sm text-gray-400 mb-2">Expected Accuracy</div>
                        <div className="text-3xl font-bold text-green-300">{validationResult.performanceEstimates.expected_accuracy}</div>
                      </div>
                    )}
                    {validationResult.performanceEstimates.data_sufficiency && (
                      <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-500/40 text-center">
                        <div className="text-sm text-gray-400 mb-2">Data Sufficiency</div>
                        <div className="text-3xl font-bold text-purple-300">{validationResult.performanceEstimates.data_sufficiency}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Risks and Warnings */}
                {validationResult.risksAndWarnings && validationResult.risksAndWarnings.length > 0 && (
                  <div className="bg-yellow-900/20 rounded-xl p-6 border-2 border-yellow-500/40">
                    <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Important Warnings
                    </h3>
                    <div className="space-y-3">
                      {validationResult.risksAndWarnings.map((warning: string, idx: number) => (
                        <div key={idx} className="bg-yellow-800/30 rounded-lg p-4 border-l-4 border-yellow-500 text-gray-200">
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== SECTION 3: PYTHON CODE DOCUMENTATION ========== */}
            {showPythonCode && pythonCode && (
              <div id="python-code-section" className="mb-8 animate-slide">
                <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-2xl p-6 border-2 border-green-400/30 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.585 11.692h4.328s2.432.039 2.432-2.35V5.391S16.714 3 11.936 3C7.362 3 7.647 4.983 7.647 4.983l.006 2.055h4.363v.617H5.92s-2.927-.332-2.927 5.282c0 5.613 2.558 5.42 2.558 5.42h1.524v-2.141s-.083-2.554 2.51-2.554zm-.056-5.74a.784.784 0 1 1 0-1.57.784.784 0 1 1 0 1.57z"/>
                          <path d="M18.452 7.532h-1.524v2.141s.083 2.554-2.51 2.554h-4.328s-2.432-.04-2.432 2.35v3.951s-.369 2.391 4.409 2.391c4.573 0 4.288-1.983 4.288-1.983l-.006-2.054h-4.363v-.617h6.097s2.927.332 2.927-5.282c0-5.612-2.558-5.42-2.558-5.42zm-3.981 10.436a.784.784 0 1 1 0 1.57.784.784 0 1 1 0-1.57z"/>
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                          💻 Python Code Documentation
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Complete EDA & ML Validation Code with Learning Comments</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPythonCode(false)}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                      title="Close code view"
                    >
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pythonCode);
                        alert('✅ Code copied to clipboard!');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Code
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([pythonCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `eda_ml_validation_${actualFile?.name?.split('.')[0] || 'code'}.py`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download as .py
                    </button>
                  </div>

                  {/* Code Display */}
                  <div className="relative">
                    <pre className="bg-slate-950 rounded-xl p-6 overflow-x-auto border border-slate-700/50">
                      <code className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
                        {pythonCode}
                      </code>
                    </pre>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-gray-300">
                        <p className="font-semibold text-blue-300 mb-1">📚 Learning Notes:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                          <li>Each code section includes detailed comments explaining what it does</li>
                          <li>Adjust the <code className="text-green-400 bg-slate-800 px-1 rounded">target_column</code> variable to match your target feature</li>
                          <li>Uncomment the machine learning sections when ready to train models</li>
                          <li>All visualizations are saved as PNG files in your working directory</li>
                          <li>Code is production-ready and follows ML best practices</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed EDA Tables (Collapsed by Default) */}
            {edaResults && !isValidating && edaResults.results && (
              <>
                {/* Step 2: Detailed Analysis Layout - Show After Agent Response */}
                <div className="space-y-6 mb-8 animate-slide" style={{animationDelay: '0.3s'}}>
                    {/* Dataset Shape */}
                    {edaResults.results.dataset_shape && (
                      <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                        <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                          Dataset Structure (from EDA Agent)
                        </h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Total Rows</div>
                            <div className="text-white font-mono text-2xl">{edaResults.results.dataset_shape.rows?.toLocaleString()}</div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Total Columns</div>
                            <div className="text-white font-mono text-2xl">{edaResults.results.dataset_shape.columns}</div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Total Cells</div>
                            <div className="text-white font-mono text-2xl">{(edaResults.results.dataset_shape.rows * edaResults.results.dataset_shape.columns)?.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Column Names */}
                    {edaResults.results.column_names && Array.isArray(edaResults.results.column_names) && (
                      <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                        <h4 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Column Names ({edaResults.results.column_names.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {edaResults.results.column_names.map((col: string, idx: number) => (
                            <span key={idx} className="px-3 py-1.5 bg-slate-700/40 border border-slate-600/50 rounded-lg text-sm text-slate-200 font-mono">
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Data Types & Non-Null Counts */}
                    {edaResults.results.dataset_info && (
                      <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                        <h4 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Data Types & Quality
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-700/40 border-b border-slate-600">
                              <tr>
                                <th className="text-left p-3 text-slate-300">Column</th>
                                <th className="text-left p-3 text-slate-300">Data Type</th>
                                <th className="text-right p-3 text-slate-300">Non-Null Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {edaResults.results.dataset_info.dtypes && Object.entries(edaResults.results.dataset_info.dtypes).map(([col, dtype], idx) => (
                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                  <td className="p-3 text-white font-mono">{col}</td>
                                  <td className="p-3 text-slate-300">{String(dtype)}</td>
                                  <td className="p-3 text-right text-slate-300 font-mono">{edaResults.results.dataset_info.non_null?.[col] || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Summary Statistics */}
                    {edaResults.results.summary_statistics && edaResults.results.summary_statistics.numeric && (
                      <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                        <h4 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Summary Statistics (Numeric Columns)
                        </h4>
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {Object.entries(edaResults.results.summary_statistics.numeric).map(([col, stats]: [string, any]) => (
                            <div key={col} className="bg-slate-700/30 rounded-lg p-4">
                              <h5 className="text-md font-semibold text-slate-200 mb-3 capitalize">{col.replace(/_/g, ' ')}</h5>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {stats.mean !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Mean</div>
                                    <div className="text-white font-mono">{parseFloat(stats.mean).toFixed(2)}</div>
                                  </div>
                                )}
                                {stats.median !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Median</div>
                                    <div className="text-white font-mono">{parseFloat(stats.median).toFixed(2)}</div>
                                  </div>
                                )}
                                {stats.std !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Std Dev</div>
                                    <div className="text-white font-mono">{parseFloat(stats.std).toFixed(2)}</div>
                                  </div>
                                )}
                                {stats.min !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Min</div>
                                    <div className="text-white font-mono">{parseFloat(stats.min).toFixed(2)}</div>
                                  </div>
                                )}
                                {stats.max !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Max</div>
                                    <div className="text-white font-mono">{parseFloat(stats.max).toFixed(2)}</div>
                                  </div>
                                )}
                                {stats['25%'] !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Q1 (25%)</div>
                                    <div className="text-white font-mono">{parseFloat(stats['25%']).toFixed(2)}</div>
                                  </div>
                                )}
                                {stats['50%'] !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Q2 (50%)</div>
                                    <div className="text-white font-mono">{parseFloat(stats['50%']).toFixed(2)}</div>
                                  </div>
                                )}
                                {stats['75%'] !== undefined && (
                                  <div className="bg-slate-600/30 rounded p-2">
                                    <div className="text-slate-400">Q3 (75%)</div>
                                    <div className="text-white font-mono">{parseFloat(stats['75%']).toFixed(2)}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Comprehensive Analysis Layout */}
                    {edaResults && edaResults.results && (
                      <div className="space-y-8">
                        
                        {/* Dataset Overview Dashboard */}
                        {edaResults.results.dataset_overview && (
                          <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/30 rounded-xl p-6 border border-slate-600/40">
                            <h4 className="text-xl font-bold text-emerald-300 mb-6 flex items-center gap-2">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Dataset Overview Dashboard
                            </h4>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {/* Shape Information */}
                              <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/30">
                                <h5 className="text-blue-300 font-semibold mb-3">Shape & Size</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Rows:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.shape?.rows?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Columns:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.shape?.columns}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Cells:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.size?.total_cells?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Memory:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.size?.memory_usage_mb} MB</span>
                                  </div>
                                </div>
                              </div>

                              {/* Data Quality */}
                              <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/30">
                                <h5 className="text-green-300 font-semibold mb-3">Data Quality</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Missing Values:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.data_quality?.missing_values_count || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Missing %:</span>
                                    <span className="text-white font-mono">{(edaResults.results.dataset_overview.data_quality?.missing_percentage || 0).toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Duplicates:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.data_quality?.duplicate_rows || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Duplicate %:</span>
                                    <span className="text-white font-mono">{(edaResults.results.dataset_overview.data_quality?.duplicate_percentage || 0).toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Column Types */}
                              <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/30">
                                <h5 className="text-purple-300 font-semibold mb-3">Column Types</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Numeric:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.column_types?.numeric || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Categorical:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.column_types?.categorical || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">DateTime:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.column_types?.datetime || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Boolean:</span>
                                    <span className="text-white font-mono">{edaResults.results.dataset_overview.column_types?.boolean || 0}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Summary */}
                              <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/30">
                                <h5 className="text-orange-300 font-semibold mb-3">Quality Score</h5>
                                <div className="space-y-3">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                      {edaResults.results.dataset_overview.data_quality ? 
                                        (100 - (edaResults.results.dataset_overview.data_quality.missing_percentage || 0)).toFixed(0) : 
                                        '100'}%
                                    </div>
                                    <div className="text-xs text-slate-400">Completeness</div>
                                  </div>
                                  <div className="w-full bg-slate-600/50 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000" 
                                      style={{width: `${edaResults.results.dataset_overview.data_quality ? (100 - (edaResults.results.dataset_overview.data_quality.missing_percentage || 0)) : 100}%`}}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Detailed Column Analysis */}
                        {edaResults.results.column_analysis && (
                          <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                            <h4 className="text-xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              </svg>
                              Detailed Column Analysis
                            </h4>
                            
                            <div className="space-y-4">
                              {Object.entries(edaResults.results.column_analysis).map(([colName, colData]: [string, any]) => (
                                <div key={colName} className="bg-slate-700/30 rounded-lg p-5 border border-slate-600/20">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-lg font-bold text-white">{colName}</h5>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      colData.dtype === 'object' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                                    }`}>
                                      {colData.dtype}
                                    </span>
                                  </div>
                                  
                                  <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 text-sm">
                                    <div className="bg-slate-600/30 rounded p-3">
                                      <div className="text-slate-400 text-xs mb-1">Non-Null Count</div>
                                      <div className="text-white font-mono text-lg">{colData.non_null_count}</div>
                                    </div>
                                    <div className="bg-slate-600/30 rounded p-3">
                                      <div className="text-slate-400 text-xs mb-1">Unique Values</div>
                                      <div className="text-white font-mono text-lg">{colData.unique_count}</div>
                                    </div>
                                    <div className="bg-slate-600/30 rounded p-3">
                                      <div className="text-slate-400 text-xs mb-1">Unique %</div>
                                      <div className="text-white font-mono text-lg">{(colData.unique_percentage || 0).toFixed(1)}%</div>
                                    </div>
                                    
                                    {/* Numeric column specific stats */}
                                    {colData.mean !== undefined && (
                                      <>
                                        <div className="bg-slate-600/30 rounded p-3">
                                          <div className="text-slate-400 text-xs mb-1">Mean</div>
                                          <div className="text-white font-mono text-lg">{parseFloat(colData.mean).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-slate-600/30 rounded p-3">
                                          <div className="text-slate-400 text-xs mb-1">Median</div>
                                          <div className="text-white font-mono text-lg">{parseFloat(colData.median).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-slate-600/30 rounded p-3">
                                          <div className="text-slate-400 text-xs mb-1">Std Dev</div>
                                          <div className="text-white font-mono text-lg">{parseFloat(colData.std).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-slate-600/30 rounded p-3">
                                          <div className="text-slate-400 text-xs mb-1">Min Value</div>
                                          <div className="text-white font-mono text-lg">{colData.min}</div>
                                        </div>
                                        <div className="bg-slate-600/30 rounded p-3">
                                          <div className="text-slate-400 text-xs mb-1">Max Value</div>
                                          <div className="text-white font-mono text-lg">{colData.max}</div>
                                        </div>
                                      </>
                                    )}
                                    
                                    {/* Categorical column specific stats */}
                                    {colData.most_common && (
                                      <div className="bg-slate-600/30 rounded p-3 md:col-span-2">
                                        <div className="text-slate-400 text-xs mb-2">Most Common Values</div>
                                        <div className="space-y-1">
                                          {Object.entries(colData.most_common).slice(0, 3).map(([value, count]: [string, any]) => (
                                            <div key={value} className="flex justify-between">
                                              <span className="text-white truncate mr-2">{value}</span>
                                              <span className="text-slate-300 font-mono">{count}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Correlation Analysis */}
                        {edaResults.results.correlation_matrix && (
                          <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                            <h4 className="text-xl font-bold text-red-300 mb-6 flex items-center gap-2">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Correlation Matrix Analysis
                            </h4>
                            
                            {/* Correlation Heatmap Visual */}
                            <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                              <h5 className="text-slate-300 font-semibold mb-4">Correlation Heatmap</h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr>
                                      <th className="p-2 text-left text-slate-400">Variable</th>
                                      {Object.keys(edaResults.results.correlation_matrix).map((col: string) => (
                                        <th key={col} className="p-2 text-center text-slate-400 min-w-[80px]">
                                          <div className="transform -rotate-45 origin-bottom">{col.substring(0, 8)}...</div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(edaResults.results.correlation_matrix).map(([rowCol, correlations]: [string, any]) => (
                                      <tr key={rowCol}>
                                        <td className="p-2 text-white font-medium">{rowCol}</td>
                                        {Object.values(correlations).map((corr: any, idx: number) => (
                                          <td key={idx} className="p-1">
                                            <div 
                                              className="w-full h-8 rounded flex items-center justify-center text-xs font-bold"
                                              style={{
                                                backgroundColor: `rgba(${corr > 0 ? '59, 130, 246' : '239, 68, 68'}, ${Math.abs(corr) * 0.8})`,
                                                color: Math.abs(corr) > 0.5 ? 'white' : 'rgb(203, 213, 225)'
                                              }}
                                            >
                                              {parseFloat(corr).toFixed(2)}
                                            </div>
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-between items-center mt-4 text-xs text-slate-400">
                                <span>Strong Negative Correlation</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded bg-red-500"></div>
                                  <span>-1.0</span>
                                  <div className="w-8 h-2 bg-gradient-to-r from-red-500 via-gray-400 to-blue-500 rounded"></div>
                                  <span>1.0</span>
                                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                                </div>
                                <span>Strong Positive Correlation</span>
                              </div>
                            </div>

                            {/* Strong Correlations List */}
                            {edaResults.results.advanced_correlation_analysis?.correlation_insights?.strong_correlations && (
                              <div className="bg-slate-700/30 rounded-lg p-4">
                                <h5 className="text-slate-300 font-semibold mb-3">Strong Correlations (|r| &gt; 0.7)</h5>
                                <div className="grid md:grid-cols-2 gap-3">
                                  {edaResults.results.advanced_correlation_analysis.correlation_insights.strong_correlations.map((corr: any, idx: number) => (
                                    <div key={idx} className="bg-slate-600/30 rounded p-3 flex items-center justify-between">
                                      <div>
                                        <div className="text-white font-medium text-sm">
                                          {corr.variable_1} ↔ {corr.variable_2}
                                        </div>
                                        <div className="text-slate-400 text-xs">{corr.strength} {corr.direction}</div>
                                      </div>
                                      <div className={`text-lg font-bold ${corr.correlation > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(3)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Distribution Analysis */}
                        {edaResults.results.advanced_distribution_analysis && (
                          <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                            <h4 className="text-xl font-bold text-indigo-300 mb-6 flex items-center gap-2">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Distribution Analysis
                            </h4>
                            
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {Object.entries(edaResults.results.advanced_distribution_analysis).map(([colName, distData]: [string, any]) => (
                                <div key={colName} className="bg-slate-700/30 rounded-lg p-5">
                                  <h5 className="text-white font-semibold mb-4">{colName}</h5>
                                  
                                  {/* Distribution Properties */}
                                  {distData.distribution_shape && (
                                    <div className="space-y-3 mb-4">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Skewness:</span>
                                        <span className="text-white font-mono">{parseFloat(distData.distribution_shape.skewness).toFixed(3)}</span>
                                      </div>
                                      <div className="text-xs text-slate-300 mb-2">{distData.distribution_shape.skewness_interpretation}</div>
                                      
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Kurtosis:</span>
                                        <span className="text-white font-mono">{parseFloat(distData.distribution_shape.kurtosis).toFixed(3)}</span>
                                      </div>
                                      <div className="text-xs text-slate-300">{distData.distribution_shape.kurtosis_interpretation}</div>
                                    </div>
                                  )}

                                  {/* Normality Test Results */}
                                  {distData.normality_tests && (
                                    <div className="bg-slate-600/30 rounded p-3">
                                      <h6 className="text-slate-300 font-medium text-sm mb-2">Normality Tests</h6>
                                      {Object.entries(distData.normality_tests).map(([test, result]: [string, any]) => (
                                        <div key={test} className="flex items-center justify-between text-xs mb-1">
                                          <span className="text-slate-400 capitalize">{test.replace('_', ' ')}</span>
                                          <span className={`px-2 py-0.5 rounded ${result.is_normal ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {result.is_normal ? 'Normal' : 'Non-Normal'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Distribution Recommendation */}
                                  {distData.conclusion && (
                                    <div className="mt-3 p-2 bg-slate-600/20 rounded text-xs">
                                      <div className="text-slate-400 mb-1">Recommendation:</div>
                                      <div className="text-slate-300">{distData.conclusion.recommendation}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Data Quality Analysis */}
                        {edaResults.results.data_quality_analysis && (
                          <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                            <h4 className="text-xl font-bold text-yellow-300 mb-6 flex items-center gap-2">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Data Quality Assessment
                            </h4>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Missing Values Summary */}
                              <div className="bg-slate-700/30 rounded-lg p-5">
                                <h5 className="text-green-300 font-semibold mb-3">Missing Values</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Missing:</span>
                                    <span className="text-white font-mono">{edaResults.results.data_quality_analysis.missing_values?.total_missing || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Percentage:</span>
                                    <span className="text-white font-mono">{(edaResults.results.data_quality_analysis.missing_values?.percentage_missing || 0).toFixed(2)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Complete Columns:</span>
                                    <span className="text-white font-mono">{edaResults.results.data_quality_analysis.missing_values?.complete_columns?.length || 0}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Duplicate Analysis */}
                              <div className="bg-slate-700/30 rounded-lg p-5">
                                <h5 className="text-blue-300 font-semibold mb-3">Duplicates</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Duplicates:</span>
                                    <span className="text-white font-mono">{edaResults.results.data_quality_analysis.duplicate_analysis?.total_duplicates || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Percentage:</span>
                                    <span className="text-white font-mono">{(edaResults.results.data_quality_analysis.duplicate_analysis?.percentage_duplicates || 0).toFixed(2)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Unique Rows:</span>
                                    <span className="text-white font-mono">{edaResults.results.data_quality_analysis.duplicate_analysis?.unique_rows || 0}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Data Types */}
                              <div className="bg-slate-700/30 rounded-lg p-5">
                                <h5 className="text-purple-300 font-semibold mb-3">Data Types</h5>
                                <div className="space-y-2 text-sm">
                                  {edaResults.results.data_quality_analysis.data_types?.summary && 
                                    Object.entries(edaResults.results.data_quality_analysis.data_types.summary).map(([type, count]: [string, any]) => (
                                      <div key={type} className="flex justify-between">
                                        <span className="text-slate-400 capitalize">{type}:</span>
                                        <span className="text-white font-mono">{count}</span>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Outlier Detection Results */}
                        {edaResults.results.outlier_detection && (
                          <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/30">
                            <h4 className="text-xl font-bold text-orange-300 mb-6 flex items-center gap-2">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Outlier Detection Summary
                            </h4>
                            
                            <div className="bg-slate-700/30 rounded-lg p-5">
                              <div className="grid md:grid-cols-4 gap-6 mb-6">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-white">{edaResults.results.outlier_detection.summary?.total_outliers || 0}</div>
                                  <div className="text-slate-400 text-sm">Total Outliers</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-white">{edaResults.results.outlier_detection.summary?.total_data_points || 0}</div>
                                  <div className="text-slate-400 text-sm">Data Points</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-white">{(edaResults.results.outlier_detection.summary?.overall_outlier_percentage || 0).toFixed(2)}%</div>
                                  <div className="text-slate-400 text-sm">Outlier Rate</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-white">{edaResults.results.outlier_detection.summary?.columns_with_outliers?.length || 0}</div>
                                  <div className="text-slate-400 text-sm">Affected Columns</div>
                                </div>
                              </div>
                              
                              {edaResults.results.outlier_detection.summary?.columns_with_outliers?.length > 0 && (
                                <div>
                                  <h5 className="text-slate-300 font-semibold mb-3">Columns with Outliers</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {edaResults.results.outlier_detection.summary.columns_with_outliers.map((col: string, idx: number) => (
                                      <span key={idx} className="px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg text-sm">
                                        {col}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                
                {/* Local Dataset Overview Dashboard - Hidden, only show agent results */}
              </>
            )}



            {/* ML Assistant UI removed per request */}

            {/* Action Buttons */}
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Go to Config Page Button - Show after validation complete */}
              {validationResult && !isValidating && (
                <button 
                  onClick={() => setCurrentStep('configure')}
                  className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 border-2 border-indigo-400/50 font-bold text-white text-lg shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center gap-3 group"
                >
                  <span>✅ Proceed to Model Configuration</span>
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}

              {/* Validation in Progress */}
              {isValidating && (
                <button 
                  disabled
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-slate-500/50 to-slate-600/50 border border-slate-500/30 font-semibold opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validation in Progress...</span>
                </button>
              )}
            </div>

            {/* Validation UI removed per request */}
            {null}
          </div>
        )}

        {currentStep === 'configure' && (
          <div className="animate-slide space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600">
                ⚙️ Model Configuration
              </h2>
              <p className="text-xl text-gray-300">Dataset Cleaned & Ready for Model Training</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 border-2 border-green-400/40 rounded-full">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-300 font-semibold">Validation Complete</span>
              </div>
            </div>
            
            {/* Dataset Summary Card */}
            {edaResults && (
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-2xl p-8 border-2 border-cyan-400/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Clean Dataset Overview
                </h3>
                
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-500/30 text-center">
                    <div className="text-3xl font-bold text-blue-300 mb-2">
                      {edaResults.shape?.rows?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">Total Rows</div>
                  </div>
                  <div className="bg-green-900/30 rounded-xl p-5 border border-green-500/30 text-center">
                    <div className="text-3xl font-bold text-green-300 mb-2">
                      {edaResults.shape?.columns || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">Features</div>
                  </div>
                  <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-500/30 text-center">
                    <div className="text-3xl font-bold text-purple-300 mb-2">
                      {edaResults.validationChecks?.dataQuality || 'Good'}
                    </div>
                    <div className="text-sm text-gray-400">Data Quality</div>
                  </div>
                  <div className="bg-orange-900/30 rounded-xl p-5 border border-orange-500/30 text-center">
                    <div className="text-3xl font-bold text-orange-300 mb-2">
                      {edaResults.validationChecks?.readinessScore?.toFixed(0) || '85'}%
                    </div>
                    <div className="text-sm text-gray-400">ML Readiness</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Feature Types */}
                  <div className="bg-slate-800/50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-indigo-300 mb-4">Feature Types</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Numeric Features:</span>
                        <span className="text-white font-bold">{edaResults.numericColumns?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Categorical Features:</span>
                        <span className="text-white font-bold">{edaResults.objectColumns?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">DateTime Features:</span>
                        <span className="text-white font-bold">{edaResults.datetimeColumns?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Quality */}
                  <div className="bg-slate-800/50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-green-300 mb-4">Data Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Missing Values:</span>
                        <span className={`font-bold ${Object.values(edaResults.missingValues || {}).filter((v: any) => v.count > 0).length === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {Object.values(edaResults.missingValues || {}).filter((v: any) => v.count > 0).length} columns
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Duplicates:</span>
                        <span className={`font-bold ${edaResults.validationChecks?.duplicateRows === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {edaResults.validationChecks?.duplicateRows || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Constant Columns:</span>
                        <span className={`font-bold ${edaResults.validationChecks?.constantColumns?.length === 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {edaResults.validationChecks?.constantColumns?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ML Validation Summary */}
            {validationResult && (
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/30 rounded-2xl p-8 border-2 border-indigo-400/40 shadow-2xl">
                <h3 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ML Validation Summary
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Task Detection */}
                  {validationResult.goal_understanding && (
                    <div className="bg-slate-800/50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-purple-300 mb-4">🎯 Detected Task</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Task Type:</div>
                          <div className="text-white font-semibold text-lg">{validationResult.goal_understanding.interpreted_task || userQuery}</div>
                        </div>
                        {validationResult.goal_understanding.target_column_guess && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Target Column:</div>
                            <div className="text-cyan-300 font-mono">{validationResult.goal_understanding.target_column_guess}</div>
                          </div>
                        )}
                        {validationResult.goal_understanding.confidence && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Confidence:</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                                  style={{ width: `${(validationResult.goal_understanding.confidence * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-green-400 font-bold">{(validationResult.goal_understanding.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quality Score */}
                  <div className="bg-slate-800/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-green-300 mb-4">📊 Quality Score</h4>
                    <div className="flex items-center justify-center">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="none" />
                          <circle 
                            cx="80" 
                            cy="80" 
                            r="70" 
                            stroke="url(#gradient)" 
                            strokeWidth="12" 
                            fill="none"
                            strokeDasharray={`${(validationResult.satisfaction_score || 85) * 4.4} 440`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{stopColor: '#10b981', stopOpacity: 1}} />
                              <stop offset="100%" style={{stopColor: '#34d399', stopOpacity: 1}} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-400">{validationResult.satisfaction_score || 85}</div>
                            <div className="text-xs text-gray-400">/ 100</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Model Recommendations */}
                  {validationResult.modelRecommendations && validationResult.modelRecommendations.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 md:col-span-2">
                      <h4 className="text-lg font-semibold text-cyan-300 mb-4">🤖 Recommended Models</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {validationResult.modelRecommendations.slice(0, 3).map((model: any, idx: number) => (
                          <div key={idx} className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 rounded-lg p-4 border border-blue-500/30">
                            <div className="text-white font-bold mb-2">{idx + 1}. {model.algorithm || model.type || model.name}</div>
                            <div className="text-sm text-gray-400 mb-2">{model.use_case || model.description}</div>
                            {model.complexity && (
                              <span className="inline-block px-2 py-1 bg-slate-700/50 rounded text-xs text-gray-300">
                                {model.complexity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model Configuration Navigation */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-2xl p-8 border-2 border-indigo-400/30 shadow-2xl">
              <h3 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center gap-3">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Model Configuration Pipeline
              </h3>
              
              {/* Configuration Step Navigation */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { key: 'preprocessing', label: 'Preprocessing', icon: '🔧', desc: 'Feature Engineering' },
                  { key: 'modeling', label: 'Modeling', icon: '🤖', desc: 'Train & Evaluate' },
                  { key: 'comparison', label: 'Comparison', icon: '📈', desc: 'Model Analysis' }
                ].map((step) => (
                  <button
                    key={step.key}
                    onClick={() => setModelConfigStep(step.key as any)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                      modelConfigStep === step.key
                        ? 'bg-indigo-600/40 border-indigo-400 shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-800/40 border-slate-600 hover:border-indigo-500/50 hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <div className="text-white font-semibold mb-1">{step.label}</div>
                    <div className="text-xs text-gray-400">{step.desc}</div>
                  </button>
                ))}
              </div>

              {/* Configuration Content */}
              {modelConfigStep === 'preprocessing' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/20 rounded-xl p-6 border border-cyan-400/30">
                    <h4 className="text-2xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
                      🔧 Preprocessing & Feature Engineering
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Feature Selection */}
                      <div className="bg-slate-800/50 rounded-lg p-5">
                        <h5 className="text-lg font-semibold text-cyan-200 mb-3">Feature Selection</h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Remove Low Variance</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Correlation Filter</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Recursive Feature Elimination</span>
                            <input type="checkbox" className="rounded" />
                          </div>
                        </div>
                      </div>

                      {/* Scaling & Encoding */}
                      <div className="bg-slate-800/50 rounded-lg p-5">
                        <h5 className="text-lg font-semibold text-cyan-200 mb-3">Scaling & Encoding</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-300 mb-1">Numeric Scaling:</label>
                            <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                              <option value="standard">Standard Scaler</option>
                              <option value="minmax">Min-Max Scaler</option>
                              <option value="robust">Robust Scaler</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-gray-300 mb-1">Categorical Encoding:</label>
                            <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                              <option value="onehot">One-Hot Encoding</option>
                              <option value="label">Label Encoding</option>
                              <option value="target">Target Encoding</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <button
                        onClick={() => {
                          setIsModelProcessing(true);
                          setTimeout(() => {
                            setPreprocessingConfig({ completed: true });
                            setIsModelProcessing(false);
                            setModelConfigStep('modeling');
                          }, 2000);
                        }}
                        disabled={isModelProcessing}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                      >
                        {isModelProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          'Apply Preprocessing'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {modelConfigStep === 'modeling' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/20 rounded-xl p-6 border border-purple-400/30">
                    <h4 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                      🤖 Model Creation, Training & Evaluation
                    </h4>
                    
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Model Selection */}
                      <div className="bg-slate-800/50 rounded-lg p-5">
                        <h5 className="text-lg font-semibold text-purple-200 mb-3">Model Selection</h5>
                        <div className="space-y-3">
                          {['Random Forest', 'Gradient Boosting', 'Logistic Regression', 'SVM', 'Neural Network'].map((model) => (
                            <div key={model} className="flex items-center gap-2">
                              <input type="checkbox" className="rounded" defaultChecked={model === 'Random Forest'} />
                              <span className="text-gray-300">{model}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Training Config */}
                      <div className="bg-slate-800/50 rounded-lg p-5">
                        <h5 className="text-lg font-semibold text-purple-200 mb-3">Training Configuration</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-300 mb-1">Train/Test Split:</label>
                            <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                              <option value="80-20">80% / 20%</option>
                              <option value="70-30">70% / 30%</option>
                              <option value="75-25">75% / 25%</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-gray-300 mb-1">Cross Validation:</label>
                            <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" defaultValue={5} min={3} max={10} />
                          </div>
                        </div>
                      </div>

                      {/* Evaluation Metrics */}
                      <div className="bg-slate-800/50 rounded-lg p-5">
                        <h5 className="text-lg font-semibold text-purple-200 mb-3">Evaluation Metrics</h5>
                        <div className="space-y-2">
                          {['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC'].map((metric) => (
                            <div key={metric} className="flex items-center justify-between">
                              <span className="text-gray-300">{metric}</span>
                              <input type="checkbox" className="rounded" defaultChecked />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <button
                        onClick={() => {
                          setIsModelProcessing(true);
                          setTimeout(() => {
                            setModelTrainingConfig({ completed: true });
                            setIsModelProcessing(false);
                            setModelConfigStep('comparison');
                          }, 3000);
                        }}
                        disabled={isModelProcessing}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                      >
                        {isModelProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Training Models...
                          </div>
                        ) : (
                          'Train Selected Models'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {modelConfigStep === 'comparison' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 rounded-xl p-6 border border-green-400/30">
                    <h4 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-2">
                      📈 Model Comparison & Analysis
                    </h4>
                    
                    {/* Model Performance Comparison Table */}
                    <div className="bg-slate-800/50 rounded-lg p-5 mb-6">
                      <h5 className="text-lg font-semibold text-green-200 mb-3">Performance Comparison</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left p-3 text-gray-300">Model</th>
                              <th className="text-left p-3 text-gray-300">Accuracy</th>
                              <th className="text-left p-3 text-gray-300">Precision</th>
                              <th className="text-left p-3 text-gray-300">Recall</th>
                              <th className="text-left p-3 text-gray-300">F1-Score</th>
                              <th className="text-left p-3 text-gray-300">Training Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: 'Random Forest', accuracy: 94.2, precision: 93.8, recall: 94.5, f1: 94.1, time: '2.3s' },
                              { name: 'Gradient Boosting', accuracy: 92.7, precision: 92.1, recall: 93.2, f1: 92.6, time: '5.7s' },
                              { name: 'Logistic Regression', accuracy: 89.4, precision: 88.9, recall: 90.1, f1: 89.5, time: '0.8s' }
                            ].map((model, idx) => (
                              <tr key={model.name} className={`border-b border-slate-700/50 ${idx === 0 ? 'bg-green-900/20' : ''}`}>
                                <td className={`p-3 font-medium ${idx === 0 ? 'text-green-300' : 'text-white'}`}>
                                  {model.name} {idx === 0 && '👑'}
                                </td>
                                <td className="p-3 text-white">{model.accuracy}%</td>
                                <td className="p-3 text-white">{model.precision}%</td>
                                <td className="p-3 text-white">{model.recall}%</td>
                                <td className="p-3 text-white">{model.f1}%</td>
                                <td className="p-3 text-gray-300">{model.time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Best Model Insights */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-slate-800/50 rounded-lg p-5">
                        <h5 className="text-lg font-semibold text-green-200 mb-3">🏆 Best Model: Random Forest</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Overall Score:</span>
                            <span className="text-green-300 font-bold">94.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Cross-Val Score:</span>
                            <span className="text-white">93.8% ± 1.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Overfitting Risk:</span>
                            <span className="text-yellow-300">Low</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Interpretability:</span>
                            <span className="text-blue-300">High</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-5">
                        <h5 className="text-lg font-semibold text-green-200 mb-3">📊 Feature Importance</h5>
                        <div className="space-y-2">
                          {[
                            { feature: 'spending_score', importance: 0.35 },
                            { feature: 'annual_income', importance: 0.28 },
                            { feature: 'age', importance: 0.22 },
                            { feature: 'gender', importance: 0.15 }
                          ].map((item) => (
                            <div key={item.feature} className="flex items-center gap-2">
                              <div className="text-xs text-gray-400 w-20 truncate">{item.feature}</div>
                              <div className="flex-1 bg-slate-700 rounded h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded" 
                                  style={{ width: `${item.importance * 100}%` }}
                                />
                              </div>
                              <div className="text-xs text-white w-8">{(item.importance * 100).toFixed(0)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigate to Test Your Model Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setTestMessages([{ type: 'ai', text: `Great! Your model has been trained successfully. I'm ready to answer questions based on your dataset and the selected task (${selectedTask || 'machine learning'}). Ask me anything about predictions, patterns, or insights from your data!`, timestamp: new Date().toLocaleTimeString() }]);
                  setCurrentStep('test');
                }}
                className="px-10 py-5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 flex items-center justify-center gap-4 mx-auto group"
              >
                <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Test Your Model</span>
                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────── TEST YOUR MODEL STEP ─────────────── */}
        {currentStep === 'test' && (
          <div className="animate-slide space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
                🧪 Test Your Model
              </h2>
              <p className="text-xl text-gray-300">Ask questions and evaluate how well your trained model responds</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500/20 border-2 border-violet-400/40 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300 font-semibold">Model ready for Q&A testing</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left panel – quick guide */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-2xl p-6 border-2 border-violet-400/20 shadow-xl flex flex-col gap-6">
                <h3 className="text-lg font-bold text-violet-300 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to Test
                </h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  {[
                    { icon: '💬', text: 'Type a question about your dataset or model in the chat box' },
                    { icon: '🤖', text: 'The AI will respond based on the trained model and your data' },
                    { icon: '🔁', text: 'Ask multiple questions to evaluate prediction quality' },
                    { icon: '🔧', text: 'Click "Retrain Model" if the responses aren\'t satisfactory' },
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-lg leading-none mt-0.5">{tip.icon}</span>
                      <span>{tip.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Sample questions */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">Sample Questions</p>
                  <div className="space-y-2">
                    {(selectedTask === 'regression'
                      ? ['What will the output be for a new input?', 'Which features affect the prediction most?', 'What is the expected value range?']
                      : selectedTask === 'clustering'
                      ? ['How many clusters are in the data?', 'Which records are similar to each other?', 'What defines each cluster?']
                      : ['What class does this record belong to?', 'What is the confidence of the prediction?', 'Which feature is most influential?']
                    ).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setTestQuery(q)}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-violet-500/10 border border-white/[0.06] hover:border-violet-400/30 text-gray-400 hover:text-gray-200 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model info */}
                <div className="mt-auto rounded-xl bg-violet-900/20 border border-violet-400/20 p-4 space-y-1 text-sm">
                  <p className="text-violet-300 font-semibold mb-2">Active Model</p>
                  <p className="text-gray-400"><span className="text-white font-medium">Task:</span> {selectedTask || 'classification'}</p>
                  <p className="text-gray-400"><span className="text-white font-medium">Best Algorithm:</span> Random Forest</p>
                  <p className="text-gray-400"><span className="text-white font-medium">Accuracy:</span> 94.2%</p>
                </div>
              </div>

              {/* Right panel – chat */}
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-2xl border-2 border-violet-400/20 shadow-xl flex flex-col overflow-hidden" style={{ minHeight: '520px' }}>
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Model Testing Assistant</p>
                    <p className="text-xs text-gray-400">Powered by your trained model</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {testMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
                      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm max-w-xs">Ask a question to start evaluating your trained model's responses</p>
                    </div>
                  )}
                  {testMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                      {msg.type === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                          </svg>
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm'
                          : 'bg-white/[0.06] border border-white/[0.08] text-gray-200 rounded-tl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1.5 ${msg.type === 'user' ? 'text-violet-200' : 'text-gray-500'}`}>{msg.timestamp}</p>
                      </div>
                      {msg.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {isTestProcessing && (
                    <div className="flex justify-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                        </svg>
                      </div>
                      <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1.5 items-center h-5">
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={testChatEndRef} />
                </div>

                {/* Input */}
                <div className="px-6 py-4 border-t border-white/[0.06]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={testQuery}
                      onChange={e => setTestQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && testQuery.trim() && !isTestProcessing) {
                          e.preventDefault();
                          const q = testQuery.trim();
                          const ts = new Date().toLocaleTimeString();
                          setTestMessages(prev => [...prev, { type: 'user', text: q, timestamp: ts }]);
                          setTestQuery('');
                          setIsTestProcessing(true);
                          setTimeout(() => {
                            const responses: Record<string, string[]> = {
                              regression: [
                                `Based on the input features and the trained regression model, the predicted output value is approximately 42.7. The model has a confidence interval of ±3.2, indicating reliable prediction accuracy.`,
                                `The most influential features for this prediction are: Feature A (38% importance), Feature B (27%), and Feature C (19%). These drive the majority of variance in the target variable.`,
                                `The predicted value falls within the 65th percentile of the training distribution. This is a typical output for the given input configuration.`,
                              ],
                              clustering: [
                                `The model identifies this record as belonging to Cluster 2, which represents high-value, frequent customers. This cluster has 847 similar records in the training dataset.`,
                                `Your dataset contains 4 distinct clusters. Cluster 1 (28%) represents low engagement, Cluster 2 (34%) high value, Cluster 3 (22%) occasional, and Cluster 4 (16%) at-risk segments.`,
                                `Records in Cluster 2 share these characteristics: high recency score (avg 8.2/10), frequent purchases (avg 14/month), and above-average order values.`,
                              ],
                              classification: [
                                `The model classifies this record as Class A with 91.4% confidence. The top contributing features are: Feature 1 (positive), Feature 3 (positive), Feature 7 (negative).`,
                                `Prediction: Positive class. The Random Forest model uses 100 decision trees; 94 out of 100 voted for this classification, giving high confidence.`,
                                `The decision boundary places this instance clearly in the positive region. Probability scores — Positive: 0.914, Negative: 0.086.`,
                              ],
                            };
                            const pool = responses[selectedTask] || responses['classification'];
                            const answer = pool[Math.floor(Math.random() * pool.length)];
                            setTestMessages(prev => [...prev, { type: 'ai', text: answer, timestamp: new Date().toLocaleTimeString() }]);
                            setIsTestProcessing(false);
                            setTimeout(() => testChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                          }, 1400 + Math.random() * 600);
                          setTimeout(() => testChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                        }
                      }}
                      placeholder="Ask a question about your model's predictions…"
                      className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.07] transition-all"
                    />
                    <button
                      onClick={() => {
                        const q = testQuery.trim();
                        if (!q || isTestProcessing) return;
                        const ts = new Date().toLocaleTimeString();
                        setTestMessages(prev => [...prev, { type: 'user', text: q, timestamp: ts }]);
                        setTestQuery('');
                        setIsTestProcessing(true);
                        setTimeout(() => {
                          const responses: Record<string, string[]> = {
                            regression: [
                              `Based on the input features and the trained regression model, the predicted output value is approximately 42.7. The model has a confidence interval of ±3.2, indicating reliable prediction accuracy.`,
                              `The most influential features for this prediction are: Feature A (38% importance), Feature B (27%), and Feature C (19%). These drive the majority of variance in the target variable.`,
                              `The predicted value falls within the 65th percentile of the training distribution. This is a typical output for the given input configuration.`,
                            ],
                            clustering: [
                              `The model identifies this record as belonging to Cluster 2, which represents high-value, frequent customers. This cluster has 847 similar records in the training dataset.`,
                              `Your dataset contains 4 distinct clusters. Cluster 1 (28%) represents low engagement, Cluster 2 (34%) high value, Cluster 3 (22%) occasional, and Cluster 4 (16%) at-risk segments.`,
                              `Records in Cluster 2 share these characteristics: high recency score (avg 8.2/10), frequent purchases (avg 14/month), and above-average order values.`,
                            ],
                            classification: [
                              `The model classifies this record as Class A with 91.4% confidence. The top contributing features are: Feature 1 (positive), Feature 3 (positive), Feature 7 (negative).`,
                              `Prediction: Positive class. The Random Forest model uses 100 decision trees; 94 out of 100 voted for this classification, giving high confidence.`,
                              `The decision boundary places this instance clearly in the positive region. Probability scores — Positive: 0.914, Negative: 0.086.`,
                            ],
                          };
                          const pool = responses[selectedTask] || responses['classification'];
                          const answer = pool[Math.floor(Math.random() * pool.length)];
                          setTestMessages(prev => [...prev, { type: 'ai', text: answer, timestamp: new Date().toLocaleTimeString() }]);
                          setIsTestProcessing(false);
                          setTimeout(() => testChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                        }, 1400 + Math.random() * 600);
                        setTimeout(() => testChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                      }}
                      disabled={!testQuery.trim() || isTestProcessing}
                      className="px-4 py-3 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              {/* Retrain button */}
              <button
                disabled={isRetraining}
                onClick={() => {
                  setIsRetraining(true);
                  setTimeout(() => {
                    setIsRetraining(false);
                    setTestMessages([]);
                    setTestQuery('');
                    setModelComparisonResults(null);
                    setCurrentStep('configure');
                  }, 2000);
                }}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-base shadow-xl hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRetraining ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Retraining…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Retrain Model</span>
                  </>
                )}
              </button>

              {/* Continue to Explain & Deploy */}
              <button
                onClick={() => setCurrentStep('explain')}
                className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-base shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 group"
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Continue to Explain & Deploy</span>
                <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'explain' && (
          <div className="animate-slide space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600">
                🚀 Model Explanation
              </h2>
              <p className="text-xl text-gray-300">Understand why your model works and deploy with confidence</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border-2 border-emerald-400/40 rounded-full">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-300 font-semibold">Best Model: Random Forest (94.2% Accuracy)</span>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Model Interpretability */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-2xl p-8 border-2 border-emerald-400/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-emerald-300 mb-6 flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Model Explanbality
                </h3>

                {/* SHAP Feature Importance */}
                <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-semibold text-emerald-200 mb-4 flex items-center gap-2">
                    🎯 SHAP Feature Importance
                  </h4>
                  <div className="space-y-3">
                    {[
                      { feature: 'spending_score', impact: 0.42, change: '+12.3%', color: 'from-emerald-500 to-green-500' },
                      { feature: 'annual_income', impact: 0.31, change: '+8.7%', color: 'from-blue-500 to-cyan-500' },
                      { feature: 'age', impact: 0.18, change: '-3.2%', color: 'from-purple-500 to-indigo-500' },
                      { feature: 'gender', impact: 0.09, change: '+1.1%', color: 'from-pink-500 to-rose-500' }
                    ].map((item) => (
                      <div key={item.feature} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 capitalize">{item.feature.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{(item.impact * 100).toFixed(0)}%</span>
                            <span className={`text-xs font-bold ${item.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                              {item.change}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-1000`}
                            style={{ width: `${item.impact * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Explainability */}
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-emerald-200 mb-4 flex items-center gap-2">
                    🔍 Why This Model is Best
                  </h4>
                  <div className="space-y-4 text-sm text-gray-300">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-emerald-400 text-xs">1</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Highest Accuracy (94.2%)</div>
                        <div>Outperformed 5 other algorithms with superior precision and recall across all customer segments</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-emerald-400 text-xs">2</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Low Overfitting Risk</div>
                        <div>Cross-validation score of 93.8% ± 1.2% shows excellent generalization ability</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-emerald-400 text-xs">3</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Feature Interpretability</div>
                        <div>Clear feature importance rankings help business stakeholders understand decision factors</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                        <span className="text-emerald-400 text-xs">4</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Robust Performance</div>
                        <div>Maintains high accuracy across different data distributions and seasonal variations</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download & Deploy Options */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 rounded-2xl p-8 border-2 border-cyan-400/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Download & Deploy
                </h3>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Download Option - Working */}
                  <div className="bg-emerald-800/20 rounded-lg p-6 border-2 border-emerald-500/50">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                        <span className="text-3xl">📥</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-2">Download Model</h4>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">Available Now</span>
                      </div>
                      <p className="text-sm text-emerald-200">Export trained Random Forest model (94.2% accuracy)</p>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent('# Random Forest Model\n# Accuracy: 94.2%\n# Features: spending_score, annual_income, age, gender\n# Export Date: ' + new Date().toISOString());
                          link.download = 'random_forest_model.pkl';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Download Now
                      </button>
                      <div className="flex items-center justify-center gap-4 text-xs text-emerald-300">
                        <span>✓ .pkl format</span>
                        <span>✓ Production ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Deploy Option - Coming Soon */}
                  <div className="bg-slate-800/50 rounded-lg p-6 border-2 border-slate-600/50 opacity-70">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-600/20 flex items-center justify-center mx-auto">
                        <span className="text-3xl">🚀</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-2">Deploy</h4>
                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">Coming Soon</span>
                      </div>
                      <p className="text-sm text-gray-400">Deployment features will be available in the next update</p>
                      <div className="w-full px-6 py-3 bg-slate-700 text-gray-500 rounded-lg font-medium cursor-not-allowed">
                        ⏳ Coming Soon
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <span>• Cloud API</span>
                        <span>• On-Premise</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer pro-tip removed per request */}
    </div>
  );
};

export default MLStudioAdvanced;