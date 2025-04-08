import { Task, Resource } from '@/models/models';

interface TaskSchedule {
  taskId: string;
  assignedResource: string;
  startDate: Date;
  endDate: Date;
  priority: number;
}

interface Solution {
  schedule: TaskSchedule[];
  metrics: {
    resourceUtilization: number;
    deadlineMeetingRate: number;
    workloadBalance: number;
  };
  fitness: number;
}

export class GeneticAlgorithmService {
  private tasks: Task[];
  private resources: Resource[];
  private populationSize: number;
  private generations: number;
  private mutationRate: number;

  constructor(tasks: Task[], resources: Resource[]) {
    this.tasks = tasks;
    this.resources = resources;
    this.populationSize = 50;
    this.generations = 100;
    this.mutationRate = 0.1;
  }

  public async analyzeProject(): Promise<Solution[]> {
    const population = this.createInitialPopulation();
    let bestSolutions: Solution[] = [];

    for (let gen = 0; gen < this.generations; gen++) {
      const fitnessResults = population.map(schedule => this.calculateFitness(schedule));
      
      // Sort by fitness and keep top 3 solutions
      bestSolutions = fitnessResults
        .sort((a, b) => b.fitness - a.fitness)
        .slice(0, 3);

      if (gen === this.generations - 1) break;

      // Create next generation
      const newPopulation: TaskSchedule[][] = [];

      while (newPopulation.length < this.populationSize) {
        const parent1 = this.selectParent(population, fitnessResults);
        const parent2 = this.selectParent(population, fitnessResults);
        const [child1, child2] = this.crossover(parent1, parent2, this.tasks, this.resources);
        
        newPopulation.push(this.mutate(child1));
        if (newPopulation.length < this.populationSize) {
          newPopulation.push(this.mutate(child2));
        }
      }

      population.splice(0, population.length, ...newPopulation);
    }

    return bestSolutions;
  }

  private selectParent(population: TaskSchedule[][], fitnessResults: Solution[]): TaskSchedule[] {
    // Tournament selection
    const tournamentSize = 5;
    const tournament = Array.from({ length: tournamentSize }, () => 
      Math.floor(Math.random() * population.length)
    );
    
    const winner = tournament.reduce((best, current) => 
      fitnessResults[current].fitness > fitnessResults[best].fitness ? current : best
    );
    
    return population[winner];
  }

  private createInitialPopulation(): TaskSchedule[][] {
    const population: TaskSchedule[][] = [];

    for (let i = 0; i < this.populationSize; i++) {
      const schedule: TaskSchedule[] = [];
      const availableTasks = [...this.tasks];

      while (availableTasks.length > 0) {
        const taskIndex = Math.floor(Math.random() * availableTasks.length);
        const task = availableTasks.splice(taskIndex, 1)[0];
        const resourceIndex = Math.floor(Math.random() * this.resources.length);
        const resource = this.resources[resourceIndex];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.ceil(Math.random() * 5));

        schedule.push({
          taskId: task.id,
          startDate,
          endDate,
          assignedResource: resource.id,
          priority: this.calculateTaskPriority(task)
        });
      }

      population.push(schedule);
    }

    return population;
  }

  private calculateTaskPriority(task: Task): number {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const daysUntilDeadline = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const storyPoints = task.storyPoints || 0;
    
    // Higher priority for tasks with more story points and closer deadlines
    return (1 / (daysUntilDeadline + 1)) * (storyPoints + 1);
  }

  private calculateFitness(schedule: TaskSchedule[]): Solution {
    const resourceWorkload: { [key: string]: number } = {};
    let totalStoryPoints = 0;
    let completedStoryPoints = 0;

    // Calculate total story points
    this.tasks.forEach(task => {
      totalStoryPoints += task.storyPoints;
    });

    schedule.forEach(item => {
      const task = this.tasks.find(t => t.id === item.taskId);
      if (!task) return;

      // Add to resource workload based on story points
      if (!resourceWorkload[item.assignedResource]) {
        resourceWorkload[item.assignedResource] = 0;
      }
      resourceWorkload[item.assignedResource] += task.storyPoints;

      // Check if task meets deadline
      if (item.endDate <= new Date(task.deadline)) {
        completedStoryPoints += task.storyPoints;
      }
    });

    // Calculate resource utilization (based on story points)
    const avgWorkload = Object.values(resourceWorkload).reduce((a, b) => a + b, 0) / Object.keys(resourceWorkload).length;
    const workloadVariance = Object.values(resourceWorkload).reduce((acc, load) => acc + Math.pow(load - avgWorkload, 2), 0) / Object.keys(resourceWorkload).length;
    const resourceUtilization = 1 / (1 + workloadVariance);

    // Calculate deadline meeting rate based on story points
    const deadlineMeetingRate = completedStoryPoints / totalStoryPoints;

    // Calculate workload balance
    const maxWorkload = Math.max(...Object.values(resourceWorkload));
    const minWorkload = Math.min(...Object.values(resourceWorkload));
    const workloadBalance = minWorkload / (maxWorkload || 1);

    // Combine metrics with weights
    const fitness = (
      resourceUtilization * 0.4 +
      deadlineMeetingRate * 0.4 +
      workloadBalance * 0.2
    );

    return {
      fitness,
      schedule,
      metrics: {
        resourceUtilization: resourceUtilization * 100,
        deadlineMeetingRate: deadlineMeetingRate * 100,
        workloadBalance: workloadBalance * 100
      }
    };
  }

  private crossover(parent1: TaskSchedule[], parent2: TaskSchedule[], tasks: Task[], resources: Resource[]): [TaskSchedule[], TaskSchedule[]] {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    
    const child1 = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
    const child2 = [...parent2.slice(0, crossoverPoint), ...parent1.slice(crossoverPoint)];
    
    return [child1, child2];
  }

  private mutate(schedule: TaskSchedule[]): TaskSchedule[] {
    return schedule.map(task => {
      if (Math.random() < this.mutationRate) {
        const resourceIndex = Math.floor(Math.random() * this.resources.length);
        return { ...task, assignedResource: this.resources[resourceIndex].id };
      }
      return task;
    });
  }
}

export const analyzeProject = async (tasks: Task[], resources: Resource[]): Promise<Solution[]> => {
  // Initialize population
  const populationSize = 50;
  const generations = 100;
  const mutationRate = 0.1;
  const eliteSize = 5;
  
  let population = Array.from({ length: populationSize }, () => generateRandomSchedule(tasks, resources));
  
  // Store best solutions
  const bestSolutions: Solution[] = [];
  
  // Evolution process
  for (let generation = 0; generation < generations; generation++) {
    // Evaluate fitness for all solutions
    population.forEach(solution => {
      solution.metrics = calculateMetrics(solution.schedule, tasks, resources);
    });
    
    // Sort population by fitness (higher fitness = better)
    population.sort((a, b) => {
      const fitnessA = calculateFitness(a.metrics);
      const fitnessB = calculateFitness(b.metrics);
      return fitnessB - fitnessA;
    });
    
    // Keep track of best solutions
    if (bestSolutions.length < 3) {
      bestSolutions.push(JSON.parse(JSON.stringify(population[0])));
    } else {
      // Replace worst of best solutions if current is better
      const worstBestIndex = bestSolutions.reduce((worst, solution, index) => {
        return calculateFitness(solution.metrics) < calculateFitness(bestSolutions[worst].metrics) ? index : worst;
      }, 0);
      
      if (calculateFitness(population[0].metrics) > calculateFitness(bestSolutions[worstBestIndex].metrics)) {
        bestSolutions[worstBestIndex] = JSON.parse(JSON.stringify(population[0]));
      }
    }
    
    // Create new population
    const newPopulation = [];
    
    // Keep elite solutions
    for (let i = 0; i < eliteSize; i++) {
      newPopulation.push(JSON.parse(JSON.stringify(population[i])));
    }
    
    // Fill rest of new population
    while (newPopulation.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      const [child1, child2] = crossover(parent1, parent2, tasks, resources);
      
      if (Math.random() < mutationRate) {
        mutate(child1, tasks, resources);
      }
      if (Math.random() < mutationRate) {
        mutate(child2, tasks, resources);
      }
      
      newPopulation.push(child1);
      if (newPopulation.length < populationSize) {
        newPopulation.push(child2);
      }
    }
    
    population = newPopulation;
  }
  
  // Sort best solutions by fitness
  bestSolutions.sort((a, b) => {
    const fitnessA = calculateFitness(a.metrics);
    const fitnessB = calculateFitness(b.metrics);
    return fitnessB - fitnessA;
  });
  
  return bestSolutions;
};

// Helper function to calculate resource utilization
const calculateResourceUtilization = (schedule: TaskSchedule[], resources: Resource[]): number => {
  const resourceWorkloads = new Map<string, number>();
  
  schedule.forEach(task => {
    const currentWorkload = resourceWorkloads.get(task.assignedResource) || 0;
    resourceWorkloads.set(task.assignedResource, currentWorkload + 1);
  });
  
  const totalResources = resources.length;
  const utilizedResources = resourceWorkloads.size;
  
  return (utilizedResources / totalResources) * 100;
};

// Helper function to calculate deadline meeting rate
const calculateDeadlineMeetingRate = (schedule: TaskSchedule[], tasks: Task[]): number => {
  let onTimeTasks = 0;
  
  schedule.forEach(scheduledTask => {
    const task = tasks.find(t => t.id === scheduledTask.taskId);
    if (task && new Date(task.deadline) >= scheduledTask.endDate) {
      onTimeTasks++;
    }
  });
  
  return (onTimeTasks / tasks.length) * 100;
};

// Helper function to calculate workload balance
const calculateWorkloadBalance = (schedule: TaskSchedule[], resources: Resource[]): number => {
  const resourceWorkloads = new Map<string, number>();
  
  schedule.forEach(task => {
    const currentWorkload = resourceWorkloads.get(task.assignedResource) || 0;
    resourceWorkloads.set(task.assignedResource, currentWorkload + 1);
  });
  
  const workloads = Array.from(resourceWorkloads.values());
  const avgWorkload = workloads.reduce((sum, load) => sum + load, 0) / workloads.length;
  const maxDeviation = Math.max(...workloads.map(load => Math.abs(load - avgWorkload)));
  
  return 100 - (maxDeviation / avgWorkload) * 100;
};

// Helper function to generate a random schedule
const generateRandomSchedule = (tasks: Task[], resources: Resource[]): Solution => {
  const schedule = tasks.map(task => {
    const randomResource = resources[Math.floor(Math.random() * resources.length)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 1);
    
    return {
      taskId: task.id,
      assignedResource: randomResource.id,
      startDate,
      endDate,
      priority: Math.floor(Math.random() * 3) + 1
    };
  });
  
  const metrics = calculateMetrics(schedule, tasks, resources);
  
  return {
    schedule,
    metrics,
    fitness: calculateFitness(metrics)
  };
};

// Helper function to calculate metrics for a schedule
const calculateMetrics = (schedule: any[], tasks: Task[], resources: Resource[]) => {
  const resourceUtilization = calculateResourceUtilization(schedule, resources);
  const deadlineMeetingRate = calculateDeadlineMeetingRate(schedule, tasks);
  const workloadBalance = calculateWorkloadBalance(schedule, resources);
  
  return {
    resourceUtilization,
    deadlineMeetingRate,
    workloadBalance
  };
};

// Helper function to calculate fitness score
const calculateFitness = (metrics: Solution['metrics']) => {
  return (
    metrics.resourceUtilization * 0.4 +
    metrics.deadlineMeetingRate * 0.4 +
    metrics.workloadBalance * 0.2
  );
};

// Helper function to select parent using tournament selection
const selectParent = (population: Solution[]): Solution => {
  const tournamentSize = 3;
  const tournament = [];
  
  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length);
    tournament.push(population[randomIndex]);
  }
  
  return tournament.reduce((best, current) => {
    return calculateFitness(current.metrics) > calculateFitness(best.metrics) ? current : best;
  });
};

// Helper function to perform crossover between two parents
const crossover = (parent1: Solution, parent2: Solution, tasks: Task[], resources: Resource[]): [Solution, Solution] => {
  const crossoverPoint = Math.floor(Math.random() * parent1.schedule.length);
  
  const child1Schedule = [
    ...parent1.schedule.slice(0, crossoverPoint),
    ...parent2.schedule.slice(crossoverPoint)
  ];
  
  const child2Schedule = [
    ...parent2.schedule.slice(0, crossoverPoint),
    ...parent1.schedule.slice(crossoverPoint)
  ];
  
  const child1Metrics = calculateMetrics(child1Schedule, tasks, resources);
  const child2Metrics = calculateMetrics(child2Schedule, tasks, resources);
  
  return [
    { 
      schedule: child1Schedule, 
      metrics: child1Metrics,
      fitness: calculateFitness(child1Metrics)
    },
    { 
      schedule: child2Schedule, 
      metrics: child2Metrics,
      fitness: calculateFitness(child2Metrics)
    }
  ];
};

// Helper function to mutate a solution
const mutate = (solution: Solution, tasks: Task[], resources: Resource[]) => {
  const mutationIndex = Math.floor(Math.random() * solution.schedule.length);
  const randomResource = resources[Math.floor(Math.random() * resources.length)];
  
  solution.schedule[mutationIndex] = {
    ...solution.schedule[mutationIndex],
    assignedResource: randomResource.id
  };
}; 