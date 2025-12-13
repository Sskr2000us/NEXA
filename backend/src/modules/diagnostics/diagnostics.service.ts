import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { RunDiagnosticsDto } from './dto/diagnostics.dto';

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async runDiagnostics(deviceId: string, runDiagnosticsDto: RunDiagnosticsDto) {
    const client = this.supabaseService.getServiceClient();

    // Create diagnostic run record
    const { data: diagnosticRun, error: runError } = await client
      .from('diagnostic_runs')
      .insert({
        device_id: deviceId,
        diagnostic_type: runDiagnosticsDto.diagnosticType,
        run_status: 'in_progress',
        triggered_by: runDiagnosticsDto.triggeredBy || 'manual',
      })
      .select()
      .single();

    if (runError) {
      this.logger.error(`Create diagnostic run error: ${runError.message}`);
      throw runError;
    }

    try {
      // Perform diagnostics (simplified - real implementation would run actual diagnostics)
      const metrics = {
        connectivity: 'good',
        responseTime: 150,
        batteryLevel: 85,
        signalStrength: -45,
      };

      // Check for issues
      const issues: any[] = [];
      if (metrics.responseTime > 200) {
        issues.push({
          diagnostic_run_id: diagnosticRun.id,
          device_id: deviceId,
          issue_type: 'performance',
          severity: 'medium',
          issue_description: 'High response time detected',
          detected_at: new Date().toISOString(),
        });
      }

      // Insert issues if any
      if (issues.length > 0) {
        await client.from('diagnostic_issues').insert(issues);
      }

      // Update diagnostic run with results
      await client
        .from('diagnostic_runs')
        .update({
          run_status: 'completed',
          completed_at: new Date().toISOString(),
          issues_found: issues.length,
          diagnostic_result: { metrics, issues },
        })
        .eq('id', diagnosticRun.id);

      return {
        runId: diagnosticRun.id,
        status: 'completed',
        issuesFound: issues.length,
        metrics,
        issues,
      };
    } catch (error) {
      // Update diagnostic run on failure
      await client
        .from('diagnostic_runs')
        .update({
          run_status: 'failed',
          completed_at: new Date().toISOString(),
          diagnostic_result: { error: error.message },
        })
        .eq('id', diagnosticRun.id);

      throw error;
    }
  }

  async getDiagnosticHistory(deviceId: string, limit = 20) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('diagnostic_runs')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Get diagnostic history error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getIssues(deviceId: string, severity?: string) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('diagnostic_issues')
      .select('*')
      .eq('device_id', deviceId)
      .is('resolved_at', null);

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query.order('detected_at', { ascending: false });

    if (error) {
      this.logger.error(`Get diagnostic issues error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async resolveIssue(issueId: string, resolution: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('diagnostic_issues')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: resolution,
      })
      .eq('id', issueId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Resolve issue error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getDeviceErrors(deviceId: string, limit = 50) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('device_error_logs')
      .select('*')
      .eq('device_id', deviceId)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Get device errors error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getNetworkMetrics(homeId: string, hours = 24) {
    const client = this.supabaseService.getServiceClient();

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const { data, error } = await client
      .from('network_metrics')
      .select('*')
      .eq('home_id', homeId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Get network metrics error: ${error.message}`);
      throw error;
    }

    return data;
  }
}
