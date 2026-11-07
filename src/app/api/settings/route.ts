import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SETTINGS, getSettings, resetToDefaultDataset, saveSettings } from '@/lib/storage';

export async function GET() {
  try {
    const settings = await getSettings();
    // Mask sensitive keys for client-side display
    const masked = {
      ...settings,
      openaiApiKey: settings.openaiApiKey ? 'sk-••••••••' : '',
      anthropicApiKey: settings.anthropicApiKey ? 'sk-ant-••••••••' : '',
      geminiApiKey: settings.geminiApiKey ? 'AIza••••••••' : '',
      hasEnvKeys: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY),
    };
    return NextResponse.json({ settings: masked });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'reset_seed') {
      const events = await resetToDefaultDataset();
      return NextResponse.json({ success: true, message: 'Reset to seed benchmark dataset', count: events.length });
    }

    if (body.action === 'reset_settings') {
      const reset = await saveSettings(DEFAULT_SETTINGS);
      return NextResponse.json({ success: true, settings: reset, message: 'Settings reset to default' });
    }

    const cleanBody = { ...body };
    if (typeof cleanBody.openaiApiKey === 'string' && cleanBody.openaiApiKey.includes('••••')) {
      delete cleanBody.openaiApiKey;
    }
    if (typeof cleanBody.anthropicApiKey === 'string' && cleanBody.anthropicApiKey.includes('••••')) {
      delete cleanBody.anthropicApiKey;
    }
    if (typeof cleanBody.geminiApiKey === 'string' && cleanBody.geminiApiKey.includes('••••')) {
      delete cleanBody.geminiApiKey;
    }

    const updated = await saveSettings(cleanBody);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
