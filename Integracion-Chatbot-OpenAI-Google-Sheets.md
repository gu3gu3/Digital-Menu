# OpenAI API Configuration
OPENAI_API_KEY

# Google Sheets API Configuration
GOOGLE_SHEETS_PRIVATE_KEY
GOOGLE_CHATBOT_KB_SPREADSHEET_ID


----------------------------
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  google: {
    sheets: {
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      chatbotKbSpreadsheetId: process.env.GOOGLE_CHATBOT_KB_SPREADSHEET_ID,
      leadsSpreadsheetId: process.env.GOOGLE_LEADS_SPREADSHEET_ID,
    },
    calendar: {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    },
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    adminEmail: process.env.ADMIN_EMAIL,
  },
};

export const validateConfig = () => {
  const required = [
    'OPENAI_API_KEY',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SPREADSHEET_ID',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }

  // Additional validation for Google Sheets private key format
  if (process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      console.warn('GOOGLE_SHEETS_PRIVATE_KEY appears to be in incorrect format. Should include BEGIN/END PRIVATE KEY markers.');
    }
  }
  
  return missing.length === 0;
}; 



-------------------------------
import { google } from 'googleapis';
import { config } from './config';

// Updated interfaces for the new structure
interface LeadData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  service: string;
  campaign: string;
  squareMeters?: number;
  message?: string;
  timestamp: string;
  source?: 'chatbot' | 'form' | 'manual';
  conversationSummary?: string;
}

interface ChatBotKnowledgeBase {
  system_prompt: string;
  greeting_message: string;
  whatsapp_link?: string;
  faq_1_question?: string;
  faq_1_answer?: string;
  faq_2_question?: string;
  faq_2_answer?: string;
  faq_3_question?: string;
  faq_3_answer?: string;
  faq_4_question?: string;
  faq_4_answer?: string;
  faq_5_question?: string;
  faq_5_answer?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ConversationAnalysis {
  hasContactInfo: boolean;
  extractedName?: string;
  extractedEmail?: string;
  extractedPhone?: string;
  extractedAddress?: string;
  extractedSquareMeters?: number;
  extractedService?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'information' | 'quote' | 'booking' | 'complaint';
}

// Additional interfaces for the generic system
interface ServicePatterns {
  measurementRegex: RegExp;
  measurementUnit: string;
  specificKeywords: string[];
  urgencyKeywords: string[];
}

interface ServiceData {
  squareMeters?: number;
  address?: string;
  hasUrgency: boolean;
}

class GoogleSheetsService {
  private sheets: any;
  private chatbotKbSpreadsheetId: string;
  private leadsSpreadsheetId: string;

  constructor() {
    try {
      // Check if we're in development mode and Google Sheets is not available
      const isDevelopment = process.env.NODE_ENV === 'development';
      const skipGoogleSheets = process.env.SKIP_GOOGLE_SHEETS === 'true';

      if (skipGoogleSheets) {
        console.log('⚠️  Google Sheets integration disabled (SKIP_GOOGLE_SHEETS=true)');
        this.sheets = null as any;
        this.chatbotKbSpreadsheetId = 'mock';
        this.leadsSpreadsheetId = 'mock';
        return;
      }

      // Validate configuration
      if (!config.google.sheets.clientEmail || !config.google.sheets.privateKey) {
        if (isDevelopment) {
          console.log('⚠️  Google Sheets credentials missing, using mock data for development');
          this.sheets = null as any;
          this.chatbotKbSpreadsheetId = 'mock';
          this.leadsSpreadsheetId = 'mock';
          return;
        }
        throw new Error('Missing Google Sheets credentials. Please check GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY environment variables.');
      }

      // Validate private key format
      const privateKey = config.google.sheets.privateKey;
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
        if (isDevelopment) {
          console.log('⚠️  Google Sheets private key format invalid, using mock data for development');
          this.sheets = null as any;
          this.chatbotKbSpreadsheetId = 'mock';
          this.leadsSpreadsheetId = 'mock';
          return;
        }
        throw new Error('GOOGLE_SHEETS_PRIVATE_KEY appears to be in incorrect format. Should include BEGIN/END PRIVATE KEY markers.');
      }

      // Create credentials object for GoogleAuth (this method works with Node.js 22)
      const credentials = {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID || "landing-pages-project",
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || "key-id",
        private_key: privateKey,
        client_email: config.google.sheets.clientEmail,
        client_id: process.env.GOOGLE_CLIENT_ID || "client-id",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(config.google.sheets.clientEmail)}`
      };

      // Use GoogleAuth with proper configuration (compatible with Node.js 18 and 22)
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      
      // Set spreadsheet IDs with fallbacks
      this.chatbotKbSpreadsheetId = config.google.sheets.chatbotKbSpreadsheetId || config.google.sheets.spreadsheetId!;
      this.leadsSpreadsheetId = config.google.sheets.leadsSpreadsheetId || config.google.sheets.spreadsheetId!;

      if (!this.chatbotKbSpreadsheetId || !this.leadsSpreadsheetId) {
        if (isDevelopment) {
          console.log('⚠️  Google Spreadsheet ID missing, using mock data for development');
          this.sheets = null as any;
          this.chatbotKbSpreadsheetId = 'mock';
          this.leadsSpreadsheetId = 'mock';
          return;
        }
        throw new Error('Missing Google Spreadsheet ID. Please check GOOGLE_SPREADSHEET_ID environment variable.');
      }

      console.log('✅ Google Sheets service initialized successfully');
      console.log(`📊 Chatbot KB Spreadsheet ID: ${this.chatbotKbSpreadsheetId}`);
      console.log(`📋 Leads Spreadsheet ID: ${this.leadsSpreadsheetId}`);
    } catch (error: any) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        console.log('⚠️  Google Sheets initialization failed, using mock data for development');
        console.log('Error:', error?.message || 'Unknown error');
        this.sheets = null as any;
        this.chatbotKbSpreadsheetId = 'mock';
        this.leadsSpreadsheetId = 'mock';
        return;
      }
      console.error('❌ Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  // ==================== KNOWLEDGE BASE METHODS ====================

  /**
   * Gets the knowledge base for a specific chatbot tab
   */
  async getChatBotKnowledgeBase(tabName: string): Promise<ChatBotKnowledgeBase | null> {
    try {
      // Return mock data if Google Sheets is not available
      if (!this.sheets || this.chatbotKbSpreadsheetId === 'mock') {
        console.log(`📝 Using mock knowledge base for tab: ${tabName}`);
        return this.getMockKnowledgeBase(tabName);
      }

      console.log(`Fetching knowledge base for tab: ${tabName}`);
      
      // Read all data from columns A and B (key-value pairs)
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.chatbotKbSpreadsheetId,
        range: `${tabName}!A:B`, // Read all rows from columns A and B
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.warn(`No knowledge base found for tab: ${tabName}, using mock data`);
        return this.getMockKnowledgeBase(tabName);
      }

      // Convert key-value pairs to knowledge base object
      const knowledgeBase: Partial<ChatBotKnowledgeBase> = {};
      
      for (const row of rows) {
        if (row.length >= 2) {
          const key = row[0]?.toString().trim();
          const value = row[1]?.toString().trim();
          
          if (key && value) {
            // Map the keys to our interface properties
            switch (key) {
              case 'system_prompt':
                knowledgeBase.system_prompt = value;
                break;
              case 'greeting_message':
                knowledgeBase.greeting_message = value;
                break;
              case 'whatsapp_link':
                knowledgeBase.whatsapp_link = value;
                break;
              case 'faq_1_question':
                knowledgeBase.faq_1_question = value;
                break;
              case 'faq_1_answer':
                knowledgeBase.faq_1_answer = value;
                break;
              case 'faq_2_question':
                knowledgeBase.faq_2_question = value;
                break;
              case 'faq_2_answer':
                knowledgeBase.faq_2_answer = value;
                break;
              case 'faq_3_question':
                knowledgeBase.faq_3_question = value;
                break;
              case 'faq_3_answer':
                knowledgeBase.faq_3_answer = value;
                break;
              case 'faq_4_question':
                knowledgeBase.faq_4_question = value;
                break;
              case 'faq_4_answer':
                knowledgeBase.faq_4_answer = value;
                break;
              case 'faq_5_question':
                knowledgeBase.faq_5_question = value;
                break;
              case 'faq_5_answer':
                knowledgeBase.faq_5_answer = value;
                break;
              default:
                console.log(`Unknown key in knowledge base: ${key}`);
                break;
            }
          }
        }
      }

      // Ensure required fields have default values
      const result: ChatBotKnowledgeBase = {
        system_prompt: knowledgeBase.system_prompt || 'Eres un asistente virtual profesional.',
        greeting_message: knowledgeBase.greeting_message || '¡Hola! ¿En qué puedo ayudarte hoy?',
        whatsapp_link: knowledgeBase.whatsapp_link || '',
        faq_1_question: knowledgeBase.faq_1_question || '',
        faq_1_answer: knowledgeBase.faq_1_answer || '',
        faq_2_question: knowledgeBase.faq_2_question || '',
        faq_2_answer: knowledgeBase.faq_2_answer || '',
        faq_3_question: knowledgeBase.faq_3_question || '',
        faq_3_answer: knowledgeBase.faq_3_answer || '',
        faq_4_question: knowledgeBase.faq_4_question || '',
        faq_4_answer: knowledgeBase.faq_4_answer || '',
        faq_5_question: knowledgeBase.faq_5_question || '',
        faq_5_answer: knowledgeBase.faq_5_answer || '',
      };

      console.log(`Knowledge base loaded for ${tabName}:`, {
        hasSystemPrompt: !!result.system_prompt,
        hasGreeting: !!result.greeting_message,
        faqCount: [1, 2, 3, 4, 5].filter(i => 
          result[`faq_${i}_question` as keyof ChatBotKnowledgeBase] && 
          result[`faq_${i}_answer` as keyof ChatBotKnowledgeBase]
        ).length
      });

      return result;
    } catch (error) {
      console.error(`Error fetching knowledge base for tab ${tabName}:`, error);
      console.log(`Falling back to mock data for ${tabName}`);
      return this.getMockKnowledgeBase(tabName);
    }
  }

  /**
   * Returns mock knowledge base data for development
   */
  private getMockKnowledgeBase(tabName: string): ChatBotKnowledgeBase {
    const mockData: Record<string, ChatBotKnowledgeBase> = {
      'painting-colorexpress48hrs': {
        system_prompt: 'Eres Color Express AI, un asistente virtual amigable, profesional y Experto en Pintura creado para Asistir y Proporcionar Presupuestos y/o Estimados basados en Metros Cuadrados.',
        greeting_message: '¡Hola! Soy ColorExpress AI 😊 ¿En qué puedo ayudarte hoy?',
        whatsapp_link: 'https://wa.me/13055274873?text=Hola...',
        faq_1_question: '¿Qué servicios ofrecen?',
        faq_1_answer: 'Ofrecemos servicios de pintura profesional, incluyendo pintura interior, exterior, texturas decorativas y reparaciones.',
        faq_2_question: '¿Cuánto cuesta el servicio de pintura?',
        faq_2_answer: 'Nuestros precios van desde $45 USD por m² para servicio normal y $68 USD por m² para servicio express de 48 horas.',
        faq_3_question: '¿Qué incluye el servicio express 48hrs?',
        faq_3_answer: 'El servicio express incluye preparación de superficie, pintura profesional, limpieza y garantía de 2 años, todo completado en máximo 48 horas.',
        faq_4_question: '¿Ofrecen garantía?',
        faq_4_answer: 'Sí, ofrecemos garantía de 2 años en todos nuestros trabajos de pintura.',
        faq_5_question: '¿Cómo puedo solicitar un presupuesto?',
        faq_5_answer: 'Puedes solicitar un presupuesto gratuito proporcionando los metros cuadrados aproximados y el tipo de servicio que necesitas.'
      },
      'cleaning-express24hrs': {
        system_prompt: 'Eres CleanExpress AI, un asistente virtual amigable, profesional y Experto en Servicios de Limpieza creado para Asistir y Proporcionar Presupuestos basados en Metros Cuadrados y Habitaciones.',
        greeting_message: '¡Hola! Soy CleanExpress AI 🧽 ¿En qué puedo ayudarte hoy?',
        whatsapp_link: 'https://wa.me/13055274873?text=Hola...',
        faq_1_question: '¿Qué servicios de limpieza ofrecen?',
        faq_1_answer: 'Ofrecemos limpieza residencial, comercial, limpieza profunda, mantenimiento y limpieza post-construcción.',
        faq_2_question: '¿Cuánto cuesta el servicio de limpieza?',
        faq_2_answer: 'Nuestros precios van desde $25 USD por m² para servicio normal y $50 USD por m² para servicio express del mismo día.',
        faq_3_question: '¿Qué incluye el servicio express 24hrs?',
        faq_3_answer: 'El servicio express incluye limpieza completa con productos ecológicos certificados, completado el mismo día.',
        faq_4_question: '¿Usan productos ecológicos?',
        faq_4_answer: 'Sí, utilizamos productos de limpieza ecológicos y certificados que son seguros para tu familia y mascotas.',
        faq_5_question: '¿Cómo puedo agendar una limpieza?',
        faq_5_answer: 'Puedes agendar proporcionando los metros cuadrados o número de habitaciones y el tipo de limpieza que necesitas.'
      }
    };

    return mockData[tabName] || {
      system_prompt: 'Eres un asistente virtual profesional.',
      greeting_message: '¡Hola! ¿En qué puedo ayudarte hoy?',
      whatsapp_link: '',
      faq_1_question: '¿Qué servicios ofrecen?',
      faq_1_answer: 'Ofrecemos servicios profesionales de alta calidad.',
      faq_2_question: '¿Cuánto cuesta?',
      faq_2_answer: 'Los precios varían según el servicio. Contáctanos para un presupuesto personalizado.',
      faq_3_question: '¿Tienen garantía?',
      faq_3_answer: 'Sí, ofrecemos garantía en todos nuestros servicios.',
      faq_4_question: '¿Cómo puedo contactarlos?',
      faq_4_answer: 'Puedes contactarnos a través de este chat o por WhatsApp.',
      faq_5_question: '¿Cuál es el tiempo de entrega?',
      faq_5_answer: 'Los tiempos de entrega varían según el servicio. Te proporcionaremos una estimación específica.'
    };
  }

  /**
   * Gets all FAQs from a specific tab
   */
  async getFAQs(tabName: string): Promise<FAQ[]> {
    try {
      const kb = await this.getChatBotKnowledgeBase(tabName);
      if (!kb) return [];

      const faqs: FAQ[] = [];
      
      // Extract FAQs from structure
      for (let i = 1; i <= 5; i++) {
        const question = kb[`faq_${i}_question` as keyof ChatBotKnowledgeBase] as string;
        const answer = kb[`faq_${i}_answer` as keyof ChatBotKnowledgeBase] as string;
        
        if (question && answer) {
          faqs.push({ question, answer });
        }
      }

      return faqs;
    } catch (error) {
      console.error(`Error fetching FAQs for tab ${tabName}:`, error);
      return [];
    }
  }

  /**
   * Finds the best FAQ answer based on user question
   */
  async findBestFAQAnswer(tabName: string, userQuestion: string): Promise<string | null> {
    try {
      const faqs = await this.getFAQs(tabName);
      if (faqs.length === 0) return null;

      // Simple keyword search (can be improved with AI)
      const userQuestionLower = userQuestion.toLowerCase();
      
      for (const faq of faqs) {
        const questionKeywords = faq.question.toLowerCase().split(' ');
        const matchingWords = questionKeywords.filter(word => 
          word.length > 3 && userQuestionLower.includes(word)
        );
        
        // If significant matches found
        if (matchingWords.length >= 2) {
          return faq.answer;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error finding FAQ answer for tab ${tabName}:`, error);
      return null;
    }
  }

  // ==================== LEADS MANAGEMENT METHODS ====================

  /**
   * Adds a new lead to the Google Sheet
   */
  async addLead(leadData: LeadData): Promise<boolean> {
    try {
      // Mock mode for development
      if (!this.sheets || this.leadsSpreadsheetId === 'mock') {
        console.log('📝 Mock mode: Lead would be added to Google Sheets:', {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          service: leadData.service,
          campaign: leadData.campaign,
          timestamp: new Date().toISOString()
        });
        return true;
      }

      const timestamp = new Date().toISOString();
      const values = [
        [
          timestamp,
          leadData.name,
          leadData.email,
          leadData.phone,
          leadData.squareMeters?.toString() || '',
          leadData.message || '',
          leadData.service || '',
          leadData.campaign || '',
          leadData.source || 'website',
          leadData.conversationSummary || ''
        ]
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.leadsSpreadsheetId,
        range: 'Chatbot-Leads!A:J',
        valueInputOption: 'RAW',
        requestBody: {
          values
        }
      });

      console.log('✅ Lead added to Google Sheets successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding lead to Google Sheets:', error);
      // In development, don't fail completely
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Development mode: Continuing despite Google Sheets error');
        return true;
      }
      return false;
    }
  }

  /**
   * Analyzes a conversation to automatically extract lead information
   * Support for multiple service types with specific patterns
   */
  async analyzeConversationForLead(
    conversation: Array<{ role: string; content: string; timestamp: string }>,
    service: string,
    campaign: string
  ): Promise<ConversationAnalysis> {
    try {
      const conversationText = conversation
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');

      // Basic regex patterns for any service
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      const phoneRegex = /(\+?1|0)?[\s-]?(\d{3})[\s-]?(\d{3})[\s-]?(\d{4})/;
      const nameRegex = /(?:my name is|i'm|i am|call me)\s+([A-Za-z\s]{2,30})/i;
      
      // Service-specific patterns
      const servicePatterns = this.getServiceSpecificPatterns(service.toLowerCase());
      
      const extractedEmail = conversationText.match(emailRegex)?.[0];
      const extractedPhone = conversationText.match(phoneRegex)?.[0];
      const extractedName = conversationText.match(nameRegex)?.[1]?.trim();
      
      // Extract service-specific data
      const extractedServiceData = this.extractServiceSpecificData(conversationText, servicePatterns);

      // Generic sentiment analysis
      const positiveWords = ['thanks', 'excellent', 'perfect', 'good', 'great', 'love', 'fantastic'];
      const negativeWords = ['bad', 'terrible', 'hate', 'problem', 'poor', 'horrible'];
      
      const hasPositive = positiveWords.some(word => conversationText.toLowerCase().includes(word));
      const hasNegative = negativeWords.some(word => conversationText.toLowerCase().includes(word));
      
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (hasPositive && !hasNegative) sentiment = 'positive';
      else if (hasNegative && !hasPositive) sentiment = 'negative';

      // Generic intent analysis
      const intent = this.detectIntent(conversationText, service);

      return {
        hasContactInfo: !!(extractedEmail || extractedPhone || extractedName),
        extractedName,
        extractedEmail,
        extractedPhone,
        extractedAddress: extractedServiceData.address,
        extractedSquareMeters: extractedServiceData.squareMeters,
        extractedService: service,
        sentiment,
        intent,
      };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return {
        hasContactInfo: false,
        sentiment: 'neutral',
        intent: 'information',
      };
    }
  }

  /**
   * Gets service-specific patterns
   */
  private getServiceSpecificPatterns(service: string): ServicePatterns {
    const patterns: Record<string, ServicePatterns> = {
      painting: {
        measurementRegex: /(\d+)\s*(?:sq ft|square feet|sqft|ft2)/i,
        measurementUnit: 'sq ft',
        specificKeywords: ['paint', 'painting', 'color', 'wall', 'brush', 'roller'],
        urgencyKeywords: ['express', 'fast', 'urgent', '48 hours'],
      },
      cleaning: {
        measurementRegex: /(\d+)\s*(?:sq ft|square feet|sqft|ft2|rooms?|bedrooms?|floors?)/i,
        measurementUnit: 'sq ft / rooms',
        specificKeywords: ['clean', 'cleaning', 'vacuum', 'mop', 'disinfect', 'polish'],
        urgencyKeywords: ['deep cleaning', 'urgent', 'today', 'same day'],
      },
      renovation: {
        measurementRegex: /(\d+)\s*(?:sq ft|square feet|sqft|ft2|rooms?|bathrooms?)/i,
        measurementUnit: 'sq ft / spaces',
        specificKeywords: ['renovate', 'remodel', 'build', 'expand', 'modify'],
        urgencyKeywords: ['express', 'fast', 'urgent'],
      },
      gardening: {
        measurementRegex: /(\d+)\s*(?:sq ft|square feet|sqft|ft2|plants?|trees?)/i,
        measurementUnit: 'sq ft / plants',
        specificKeywords: ['prune', 'plant', 'garden', 'lawn', 'irrigation', 'landscaping'],
        urgencyKeywords: ['urgent maintenance', 'urgent pruning'],
      },
      plumbing: {
        measurementRegex: /(\d+)\s*(?:bathrooms?|kitchens?|faucets?|pipes?|feet?)/i,
        measurementUnit: 'points/spaces',
        specificKeywords: ['plumbing', 'pipes', 'leak', 'unclog', 'installation', 'repair'],
        urgencyKeywords: ['emergency', 'leak', 'urgent', '24 hours'],
      },
    };

    return patterns[service] || patterns.painting; // Fallback to painting
  }

  /**
   * Extracts service-specific data
   */
  private extractServiceSpecificData(conversationText: string, patterns: ServicePatterns): ServiceData {
    const measurementMatch = conversationText.match(patterns.measurementRegex);
    const squareMeters = measurementMatch ? parseInt(measurementMatch[1]) : undefined;
    
    // Search for address (generic pattern)
    const addressRegex = /(?:address|location|at)\s+([^.!?]+(?:street|avenue|road|drive|lane|boulevard|way)[^.!?]*)/i;
    const addressMatch = conversationText.match(addressRegex);
    const address = addressMatch ? addressMatch[1].trim() : undefined;

    return {
      squareMeters,
      address,
      hasUrgency: patterns.urgencyKeywords.some(keyword => 
        conversationText.toLowerCase().includes(keyword.toLowerCase())
      ),
    };
  }

  /**
   * Detects intent based on service context
   */
  private detectIntent(conversationText: string, service: string): 'information' | 'quote' | 'booking' | 'complaint' {
    const text = conversationText.toLowerCase();
    
    // Intent patterns by priority
    if (text.includes('complaint') || text.includes('problem') || text.includes('bad service')) {
      return 'complaint';
    }
    
    if (text.includes('schedule') || text.includes('appointment') || text.includes('when can you')) {
      return 'booking';
    }
    
    if (text.includes('price') || text.includes('quote') || text.includes('how much') || 
        text.includes('estimate') || text.includes('cost')) {
      return 'quote';
    }
    
    return 'information';
  }

  /**
   * Automatically creates a lead from analyzed conversation
   */
  async createLeadFromConversation(
    analysis: ConversationAnalysis,
    conversation: Array<{ role: string; content: string; timestamp: string }>,
    service: string,
    campaign: string,
    tabName: string = 'Chatbot-Leads'
  ): Promise<boolean> {
    if (!analysis.hasContactInfo) {
      console.log('No contact information found in conversation');
      return false;
    }

    const leadData: LeadData = {
      name: analysis.extractedName || 'Customer from Chatbot',
      email: analysis.extractedEmail || '',
      phone: analysis.extractedPhone || '',
      address: analysis.extractedAddress || '',
      service,
      campaign,
      squareMeters: analysis.extractedSquareMeters,
      message: `Automatic lead from chatbot - Intent: ${analysis.intent} - Sentiment: ${analysis.sentiment}`,
      timestamp: new Date().toISOString(),
      source: 'chatbot',
    };

    const success = await this.addLead(leadData);
    
    if (success) {
      // Also log the conversation
      await this.updateConversationLog(
        `${leadData.name}-${Date.now()}`,
        conversation,
        'Conversations'
      );
    }

    return success;
  }

  // ==================== CONVERSATION LOGGING ====================

  async updateConversationLog(
    leadId: string,
    conversation: Array<{ role: string; content: string; timestamp: string }>,
    tabName: string = 'Conversations'
  ): Promise<boolean> {
    try {
      // Mock mode for development
      if (!this.sheets || this.leadsSpreadsheetId === 'mock') {
        console.log('📝 Mock mode: Conversation would be logged to Google Sheets:', {
          leadId,
          conversationLength: conversation.length,
          tabName
        });
        return true;
      }

      const conversationText = conversation
        .map(msg => `[${msg.timestamp}] ${msg.role}: ${msg.content}`)
        .join('\n');

      const values = [
        [
          new Date().toISOString(),
          leadId,
          conversationText,
        ],
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.leadsSpreadsheetId,
        range: `${tabName}!A:C`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values,
        },
      });

      return true;
    } catch (error) {
      console.error('Error logging conversation to Google Sheets:', error);
      return false;
    }
  }

  // ==================== INITIALIZATION METHODS ====================

  async initializeChatbotKBSheet(tabName: string): Promise<boolean> {
    try {
      console.log(`Initializing Chatbot KB sheet: ${tabName}`);
      
      // Create key-value structure in columns A and B
      const keyValuePairs = [
        ['system_prompt', 'Eres Color Express AI, un asistente virtual amigable, profesional y Experto en Pintura creado para Asistir y Proporcionar Presupuestos y/o Estimados basados en Metros Cuadrados.'],
        ['greeting_message', '¡Hola! Soy ColorExpress AI 😊 ¿En qué puedo ayudarte hoy?'],
        ['whatsapp_link', 'https://wa.me/13055274873?text=Hola...'],
        ['faq_1_question', '¿Qué servicios ofrecen?'],
        ['faq_1_answer', 'Ofrecemos desarrollo web, generación de leads y creación de apps.'],
        ['faq_2_question', '¿Cuánto cuesta el plan LeadBooster?'],
        ['faq_2_answer', 'Desde $1499, incluye landing pages, campañas de anuncios y chatbots personalizados.'],
        ['faq_3_question', '¿Qué incluye StartSite?'],
        ['faq_3_answer', 'Diseño web optimizado para SEO, soporte rápido y páginas personalizadas desde $899.'],
        ['faq_4_question', '¿Tienen apps móviles?'],
        ['faq_4_answer', 'Sí, AppForge™ permite apps móviles o web personalizadas desde $3999.'],
        ['faq_5_question', '¿Cuánto es el tiempo de entrega de StartSite?'],
        ['faq_5_answer', '🚀 Sí, con StartSite te entregamos todo esto en máximo 15 días hábiles:\n\n🌐 Desarrollo Web Profesional\n– Hasta 5 secciones informativas optimizadas.\n\n🌐 Dominio Incluido\n– .com, .net o .org por 1 año.\n\n🚀 Alojamiento Web Premium\n– Hosting rápido y seguro por 12 meses.\n\n🔍 Optimización SEO Inicial\n– Estructura SEO friendly, etiquetas básicas, sitemap.\n\n📍 Google My Business (GMB)\n– Configuración completa del perfil de negocio.\n\n🎨 Identidad Gráfica Profesional:\n– Diseño de logo.\n– Tarjetas de presentación.\n– Banner promocional para web/redes.\n\n🔥 Campañas de Google Ads (básico)\n– Configuración inicial incluida (no incluye gestión mensual).\n\nRegistro de Dominio (.com, .net o .org incluido 1 año).\nAlojamiento Web Premium (Hosting rápido y seguro por 1 año).\nOptimización SEO Inicial (estructura SEO friendly, etiquetas básicas, Sitemap).\nConfiguración de Perfil de Negocio en Google (GMB).\nDiseño de Identidad Gráfica:']
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.chatbotKbSpreadsheetId,
        range: `${tabName}!A1:B${keyValuePairs.length}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: keyValuePairs,
        },
      });

      console.log(`Chatbot KB sheet ${tabName} initialized with ${keyValuePairs.length} key-value pairs`);
      return true;
    } catch (error) {
      console.error(`Error initializing Chatbot KB sheet ${tabName}:`, error);
      return false;
    }
  }

  async initializeLeadsSheet(tabName: string): Promise<boolean> {
    try {
      console.log(`Initializing Leads sheet: ${tabName}`);
      
      // Create headers for leads
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.leadsSpreadsheetId,
        range: `${tabName}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              'Name',
              'Email',
              'Phone',
              'Address',
              'Service',
              'Square Feet',
              'Timestamp',
              'Campaign',
              'Source',
              'Message',
            ],
          ],
        },
      });

      return true;
    } catch (error) {
      console.error(`Error initializing Leads sheet ${tabName}:`, error);
      return false;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Lists all available tabs in a spreadsheet
   */
  async getAvailableTabs(spreadsheetId?: string): Promise<string[]> {
    try {
      const targetSpreadsheetId = spreadsheetId || this.chatbotKbSpreadsheetId;
      
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: targetSpreadsheetId,
      });

      const tabs = response.data.sheets?.map((sheet: any) => sheet.properties?.title || '') || [];
      return tabs.filter((tab: string) => tab !== '');
    } catch (error) {
      console.error('Error fetching available tabs:', error);
      return [];
    }
  }

  /**
   * Checks if a tab exists
   */
  async tabExists(tabName: string, spreadsheetId?: string): Promise<boolean> {
    const tabs = await this.getAvailableTabs(spreadsheetId);
    return tabs.includes(tabName);
  }
}

export const googleSheetsService = new GoogleSheetsService();
export type { 
  LeadData, 
  ChatBotKnowledgeBase, 
  FAQ, 
  ConversationAnalysis,
  ServicePatterns,
  ServiceData
}; 


---------------------------
import OpenAI from 'openai';
import { config } from './config';
import { googleSheetsService, ChatBotKnowledgeBase, ConversationAnalysis } from './google-sheets';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface EstimateRequest {
  squareMeters: number;
  service: string;
  urgency?: 'normal' | 'express';
}

interface ServiceConfiguration {
  baseRate: number;
  expressMultiplier: number;
  expressLabel: string;
  unit: string;
  estimateFormula: string;
}

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Gets chatbot response with dynamic knowledge from Google Sheets
   */
  async getChatResponse(
    messages: ChatMessage[],
    service: string,
    campaign: string,
    context?: {
      customerName?: string;
      estimateRequest?: EstimateRequest;
      tabName?: string;
    }
  ): Promise<string> {
    try {
      // Build tab name based on service and campaign
      const tabName = context?.tabName || this.buildTabName(service, campaign);
      
      // Get knowledge base from Google Sheets
      const knowledgeBase = await googleSheetsService.getChatBotKnowledgeBase(tabName);
      
      // If no specific knowledge, use default values
      const systemPrompt = knowledgeBase?.system_prompt || this.getDefaultSystemPrompt(service);
      
      // Check if user question can be answered with FAQs
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === 'user') {
        const faqAnswer = await googleSheetsService.findBestFAQAnswer(tabName, lastUserMessage.content);
        if (faqAnswer) {
          console.log('Responding with FAQ answer');
          return faqAnswer;
        }
      }
      
      // Build personalized context
      let contextualPrompt = systemPrompt;
      
      if (context?.customerName) {
        contextualPrompt += `\n\nCustomer name: ${context.customerName}`;
      }
      
      if (context?.estimateRequest) {
        const estimate = this.calculateEstimate(context.estimateRequest);
        contextualPrompt += `\n\nEstimate calculation: ${estimate}`;
      }

      // Add WhatsApp information if available
      if (knowledgeBase?.whatsapp_link) {
        contextualPrompt += `\n\nWhatsApp link available: ${knowledgeBase.whatsapp_link}`;
      }

      const openaiMessages = [
        { role: 'system' as const, content: contextualPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process your request. Could you please try again?';
    } catch (error) {
      console.error('Error getting chat response:', error);
      return 'Sorry, I\'m experiencing technical issues. Could you please try again later?';
    }
  }

  /**
   * Intelligent conversation analysis for automatic lead extraction
   */
  async analyzeConversationForLead(
    conversation: ChatMessage[],
    service: string,
    campaign: string
  ): Promise<ConversationAnalysis> {
    try {
      const conversationText = conversation
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the following conversation and extract contact information and relevant data.

INSTRUCTIONS:
1. Extract name, email, phone, address if mentioned
2. Extract square feet if mentioned
3. Analyze sentiment (positive, neutral, negative)
4. Determine intent (information, quote, booking, complaint)
5. Respond ONLY with valid JSON with this structure:
{
  "hasContactInfo": boolean,
  "extractedName": "string or null",
  "extractedEmail": "string or null", 
  "extractedPhone": "string or null",
  "extractedAddress": "string or null",
  "extractedSquareMeters": number or null,
  "sentiment": "positive|neutral|negative",
  "intent": "information|quote|booking|complaint"
}`
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const analysis = JSON.parse(aiResponse);
      
      // Validate and complete fields
      return {
        hasContactInfo: analysis.hasContactInfo || false,
        extractedName: analysis.extractedName || undefined,
        extractedEmail: analysis.extractedEmail || undefined,
        extractedPhone: analysis.extractedPhone || undefined,
        extractedAddress: analysis.extractedAddress || undefined,
        extractedSquareMeters: analysis.extractedSquareMeters || undefined,
        extractedService: service,
        sentiment: analysis.sentiment || 'neutral',
        intent: analysis.intent || 'information',
      };

    } catch (error) {
      console.error('Error analyzing conversation with AI:', error);
      // Fallback to original method
      return await googleSheetsService.analyzeConversationForLead(conversation, service, campaign);
    }
  }

  /**
   * Generates personalized greeting message from Google Sheets
   */
  async generateGreeting(
    service: string, 
    campaign: string, 
    customerName?: string,
    tabName?: string
  ): Promise<string> {
    try {
      const targetTabName = tabName || this.buildTabName(service, campaign);
      const knowledgeBase = await googleSheetsService.getChatBotKnowledgeBase(targetTabName);
      
      if (knowledgeBase?.greeting_message) {
        // Personalize greeting with customer name if available
        let greeting = knowledgeBase.greeting_message;
        if (customerName) {
          greeting = greeting.replace('{customerName}', customerName);
          // If no placeholder, add name naturally
          if (!greeting.includes(customerName)) {
            greeting = greeting.replace('Hello!', `Hello ${customerName}!`);
          }
        } else {
          // Remove empty placeholders
          greeting = greeting.replace('{customerName}', '');
        }
        return greeting;
      }

      // Default greeting if no specific configuration
      const defaultGreeting = `Hello${customerName ? ` ${customerName}` : ''}! 👋 

I'm your virtual assistant for ${service} services. I'm here to help you with:

✅ Service information
💰 Personalized quotes  
📅 Appointment scheduling
📧 Estimate delivery

How can I help you today?`;

      return defaultGreeting;
    } catch (error) {
      console.error('Error generating greeting:', error);
      return `Hello! I'm your assistant for ${service} services. How can I help you?`;
    }
  }

  /**
   * Calculates price estimates with dynamic configuration per service
   */
  private calculateEstimate(request: EstimateRequest): string {
    const serviceConfig = this.getServiceConfiguration(request.service.toLowerCase());
    
    const baseRate = serviceConfig.baseRate;
    const urgencyMultiplier = request.urgency === 'express' ? serviceConfig.expressMultiplier : 1;
    const totalCost = Math.round(baseRate * request.squareMeters * urgencyMultiplier);
    
    return `For ${request.squareMeters}${serviceConfig.unit} of ${request.service}${
      request.urgency === 'express' ? ` (${serviceConfig.expressLabel})` : ''
    }: $${totalCost.toLocaleString()} USD approximately`;
  }

  /**
   * Dynamic configuration per service type
   */
  private getServiceConfiguration(service: string): ServiceConfiguration {
    const configurations: Record<string, ServiceConfiguration> = {
      painting: {
        baseRate: 3.5,
        expressMultiplier: 1.5,
        expressLabel: '48hr express service',
        unit: ' sq ft',
        estimateFormula: 'square feet × rate per sq ft'
      },
      cleaning: {
        baseRate: 0.25,
        expressMultiplier: 2.0,
        expressLabel: 'same day express cleaning',
        unit: ' sq ft',
        estimateFormula: 'square feet × cleaning rate'
      },
      renovation: {
        baseRate: 8.0,
        expressMultiplier: 1.3,
        expressLabel: 'accelerated renovation',
        unit: ' sq ft',
        estimateFormula: 'square feet × renovation rate'
      },
      gardening: {
        baseRate: 2.5,
        expressMultiplier: 1.4,
        expressLabel: 'urgent maintenance',
        unit: ' sq ft',
        estimateFormula: 'square feet × gardening rate'
      },
      plumbing: {
        baseRate: 150,
        expressMultiplier: 2.5,
        expressLabel: '24hr emergency service',
        unit: ' points',
        estimateFormula: 'installation points × rate per point'
      },
      maintenance: {
        baseRate: 2.5,
        expressMultiplier: 1.6,
        expressLabel: 'urgent maintenance',
        unit: ' sq ft',
        estimateFormula: 'square feet × maintenance rate'
      },
      // Generic fallback
      default: {
        baseRate: 5.0,
        expressMultiplier: 1.5,
        expressLabel: 'express service',
        unit: ' units',
        estimateFormula: 'units × base rate'
      }
    };
    
    return configurations[service] || configurations.default;
  }

  /**
   * Builds tab name based on service and campaign
   */
  private buildTabName(service: string, campaign: string): string {
    // Format: service-campaign (e.g: painting-colorexpress48hrs)
    const cleanService = service.toLowerCase().replace(/\s+/g, '');
    const cleanCampaign = campaign.toLowerCase().replace(/\s+/g, '');
    return `${cleanService}-${cleanCampaign}`;
  }

  /**
   * Default prompt system as fallback
   */
  private getDefaultSystemPrompt(service: string): string {
    return `You are a virtual assistant specialized in ${service} services. 

IMPORTANT INSTRUCTIONS:
- Maintain a friendly and professional tone
- Ask specific questions to understand customer needs
- Provide realistic estimates based on square feet
- Offer scheduling options
- At the end of long conversations, offer to send summary via email
- If you detect contact information, suggest formalizing it

CAPABILITIES:
1. Answer questions about ${service}
2. Give price estimates based on sq ft
3. Schedule appointments according to availability
4. Send summaries via email

Always end by asking if they need anything else.`;
  }

  /**
   * Generates conversation summary
   */
  async summarizeConversation(messages: ChatMessage[]): Promise<string> {
    try {
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate a professional and concise summary of the following customer conversation. 
            
INCLUDE:
- Main customer requests
- Estimates or prices mentioned
- Agreements reached
- Next steps
- Contact information if provided

FORMAT: Key points in English, professional but friendly.`
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return completion.choices[0]?.message?.content || 'Could not generate summary.';
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return 'Error generating conversation summary.';
    }
  }

  /**
   * Suggests automatic lead creation based on conversation
   */
  async shouldCreateAutomaticLead(
    conversation: ChatMessage[],
    service: string,
    campaign: string
  ): Promise<{ shouldCreate: boolean; confidence: number; reason: string }> {
    try {
      const analysis = await this.analyzeConversationForLead(conversation, service, campaign);
      
      let confidence = 0;
      let reasons = [];

      // Scoring based on available information
      if (analysis.extractedEmail) confidence += 40;
      if (analysis.extractedPhone) confidence += 40;
      if (analysis.extractedName) confidence += 20;
      
      // Scoring based on intent
      if (analysis.intent === 'quote') confidence += 30;
      if (analysis.intent === 'booking') confidence += 35;
      
      // Scoring based on sentiment
      if (analysis.sentiment === 'positive') confidence += 10;
      
      // Determine if lead should be created automatically
      const shouldCreate = confidence >= 60 && analysis.hasContactInfo;
      
      if (analysis.hasContactInfo) reasons.push('Contact information detected');
      if (analysis.intent === 'quote') reasons.push('Customer requests quote');
      if (analysis.intent === 'booking') reasons.push('Customer wants to schedule appointment');
      
      return {
        shouldCreate,
        confidence,
        reason: reasons.join(', ') || 'Conversation analysis'
      };
    } catch (error) {
      console.error('Error analyzing lead creation potential:', error);
      return {
        shouldCreate: false,
        confidence: 0,
        reason: 'Analysis error'
      };
    }
  }
}

export const openaiService = new OpenAIService();
export type { ChatMessage, EstimateRequest }; 