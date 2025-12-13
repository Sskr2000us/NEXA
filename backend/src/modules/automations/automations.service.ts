import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateAutomationDto, UpdateAutomationDto, ExecuteAutomationDto } from './dto/automation.dto';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async findAll(homeId: string, isActive?: boolean) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('automations')
      .select(`
        *,
        trigger_conditions,
        actions
      `)
      .eq('home_id', homeId)
      .is('deleted_at', null);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Find automations error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async findOne(automationId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (error) {
      this.logger.error(`Find automation error: ${error.message}`);
      throw new NotFoundException('Automation not found');
    }

    return data;
  }

  async create(createAutomationDto: CreateAutomationDto) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('automations')
      .insert(createAutomationDto)
      .select()
      .single();

    if (error) {
      this.logger.error(`Create automation error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async update(automationId: string, updateAutomationDto: UpdateAutomationDto) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('automations')
      .update(updateAutomationDto)
      .eq('id', automationId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Update automation error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async remove(automationId: string) {
    const client = this.supabaseService.getServiceClient();

    const { error } = await client
      .from('automations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', automationId);

    if (error) {
      this.logger.error(`Delete automation error: ${error.message}`);
      throw error;
    }

    return { message: 'Automation deleted successfully' };
  }

  async execute(automationId: string, executeDto: ExecuteAutomationDto) {
    const client = this.supabaseService.getServiceClient();

    // Get automation details
    const automation = await this.findOne(automationId);

    // Log execution start
    const { data: execution, error: execError } = await client
      .from('automation_executions')
      .insert({
        automation_id: automationId,
        execution_status: 'in_progress',
        triggered_by: executeDto.triggeredBy || 'manual',
        trigger_context: executeDto.context || {},
      })
      .select()
      .single();

    if (execError) {
      this.logger.error(`Log execution error: ${execError.message}`);
      throw execError;
    }

    try {
      // Execute automation actions (simplified - real implementation would execute device commands)
      const results = [];
      for (const action of automation.actions as any[]) {
        results.push({
          action: action.type,
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      }

      // Update execution status
      await client
        .from('automation_executions')
        .update({
          execution_status: 'success',
          completed_at: new Date().toISOString(),
          execution_result: { actions: results },
        })
        .eq('id', execution.id);

      return {
        executionId: execution.id,
        status: 'success',
        results,
      };
    } catch (error) {
      // Update execution status on failure
      await client
        .from('automation_executions')
        .update({
          execution_status: 'failed',
          completed_at: new Date().toISOString(),
          execution_result: { error: error.message },
        })
        .eq('id', execution.id);

      throw error;
    }
  }

  async getExecutionHistory(automationId: string, limit = 20) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('automation_executions')
      .select('*')
      .eq('automation_id', automationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Get execution history error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getHealth(automationId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('automation_health_checks')
      .select('*')
      .eq('automation_id', automationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      this.logger.error(`Get automation health error: ${error.message}`);
      return null;
    }

    return data;
  }
}
