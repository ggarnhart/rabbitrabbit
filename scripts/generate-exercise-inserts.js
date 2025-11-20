const fs = require('fs');
const path = require('path');

// Read and parse CSV
const csvContent = fs.readFileSync(path.join(__dirname, '../documentation/StrengthTraining.csv'), 'utf-8');
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');

// Parse exercises
const exercises = lines.slice(1).map(line => {
  const [category, name] = line.split(',');
  return { category, name };
});

// Group by category
const exercisesByCategory = exercises.reduce((acc, exercise) => {
  if (!acc[exercise.category]) {
    acc[exercise.category] = [];
  }
  acc[exercise.category].push(exercise);
  return acc;
}, {});

// Helper function to determine exercise type based on category
function determineType(category) {
  const cardioCategories = ['CARDIO', 'RUN', 'RUN_INDOOR', 'BIKE_OUTDOOR', 'INDOOR_BIKE', 'ELLIPTICAL', 'STAIR_STEPPER'];
  const yogaCategories = ['WARM_UP']; // Stretches could be considered yoga/flexibility
  const hiitCategories = ['PLYO', 'BATTLE_ROPE', 'LADDER'];

  if (cardioCategories.includes(category)) return 'STRENGTH'; // Even cardio equipment is strength training
  if (yogaCategories.includes(category)) return 'YOGA';
  if (hiitCategories.includes(category)) return 'HIIT';

  return 'STRENGTH'; // Default to strength
}

// Helper function to extract equipment from exercise name
function extractEquipment(name, category) {
  const equipment = [];
  const nameLower = name.toLowerCase();

  if (nameLower.includes('barbell')) equipment.push('barbell');
  if (nameLower.includes('dumbbell')) equipment.push('dumbbells');
  if (nameLower.includes('kettlebell')) equipment.push('kettlebell');
  if (nameLower.includes('cable')) equipment.push('cable machine');
  if (nameLower.includes('medicine_ball') || nameLower.includes('medicine ball')) equipment.push('medicine ball');
  if (nameLower.includes('swiss_ball') || nameLower.includes('swiss ball')) equipment.push('swiss ball');
  if (nameLower.includes('bosu')) equipment.push('bosu ball');
  if (nameLower.includes('ez_bar') || nameLower.includes('ez bar')) equipment.push('ez bar');
  if (nameLower.includes('trx') || nameLower.includes('suspended') || category === 'SUSPENSION') equipment.push('suspension trainer');
  if (nameLower.includes('band') || category === 'BANDED_EXERCISES') equipment.push('resistance band');
  if (nameLower.includes('rope') && category === 'BATTLE_ROPE') equipment.push('battle rope');
  if (nameLower.includes('smith_machine') || nameLower.includes('smith machine')) equipment.push('smith machine');
  if (nameLower.includes('foam_roller') || nameLower.includes('foam roller')) equipment.push('foam roller');
  if (category === 'SLED') equipment.push('sled');
  if (category === 'SANDBAG') equipment.push('sandbag');
  if (category === 'TIRE') equipment.push('tire');
  if (category === 'SLEDGE_HAMMER') equipment.push('sledgehammer');
  if (nameLower.includes('bench') && !nameLower.includes('bench_press')) equipment.push('bench');
  if (nameLower.includes('box')) equipment.push('box');
  if (nameLower.includes('ring')) equipment.push('rings');
  if (nameLower.includes('parallette')) equipment.push('parallettes');
  if (nameLower.includes('sliding') || nameLower.includes('slide')) equipment.push('sliding discs');

  // Cardio equipment
  if (category === 'ELLIPTICAL') equipment.push('elliptical');
  if (category === 'STAIR_STEPPER') equipment.push('stair stepper');
  if (category === 'BIKE_OUTDOOR') equipment.push('bike');
  if (category === 'INDOOR_BIKE' || nameLower.includes('stationary') || nameLower.includes('assault') || nameLower.includes('air_bike')) equipment.push('stationary bike');
  if (category === 'RUN_INDOOR' || nameLower.includes('treadmill')) equipment.push('treadmill');
  if (nameLower.includes('jump_rope') || nameLower.includes('jump rope')) equipment.push('jump rope');

  // Bodyweight if no equipment found
  if (equipment.length === 0) {
    equipment.push('bodyweight');
  }

  return [...new Set(equipment)]; // Remove duplicates
}

// Helper function to generate tags based on exercise name and category
function generateTags(name, category) {
  const tags = [];
  const nameLower = name.toLowerCase();

  // Body parts
  if (category === 'BENCH_PRESS' || category === 'PUSH_UP' || category === 'FLYE' || nameLower.includes('chest')) tags.push('chest');
  if (category === 'PULL_UP' || category === 'ROW' || nameLower.includes('back') || nameLower.includes('lat')) tags.push('back');
  if (category === 'SHOULDER_PRESS' || category === 'SHOULDER_STABILITY' || category === 'LATERAL_RAISE' || nameLower.includes('shoulder')) tags.push('shoulders');
  if (category === 'CURL' || nameLower.includes('bicep')) tags.push('biceps');
  if (category === 'TRICEPS_EXTENSION' || nameLower.includes('tricep') || nameLower.includes('dip')) tags.push('triceps');
  if (category === 'SQUAT' || category === 'LUNGE' || nameLower.includes('quad')) tags.push('legs', 'quads');
  if (category === 'DEADLIFT' || category === 'LEG_CURL' || nameLower.includes('hamstring')) tags.push('legs', 'hamstrings');
  if (category === 'HIP_RAISE' || category === 'HIP_STABILITY' || category === 'HIP_SWING' || nameLower.includes('glute') || nameLower.includes('hip')) tags.push('glutes', 'hips');
  if (category === 'CALF_RAISE') tags.push('calves', 'legs');
  if (category === 'CORE' || category === 'CRUNCH' || category === 'PLANK' || category === 'SIT_UP' || nameLower.includes('abs') || nameLower.includes('core')) tags.push('core', 'abs');
  if (category === 'CHOP' || nameLower.includes('oblique') || nameLower.includes('rotation')) tags.push('core', 'obliques');
  if (category === 'HYPEREXTENSION' || nameLower.includes('lower_back') || nameLower.includes('lower back')) tags.push('lower back');
  if (category === 'SHRUG' || nameLower.includes('trap')) tags.push('traps');
  if (nameLower.includes('forearm') || nameLower.includes('wrist')) tags.push('forearms');

  // Movement patterns
  if (category === 'SQUAT' || nameLower.includes('squat')) tags.push('squat pattern');
  if (category === 'DEADLIFT' || nameLower.includes('deadlift')) tags.push('hinge pattern');
  if (category === 'LUNGE' || nameLower.includes('lunge')) tags.push('lunge pattern');
  if (category === 'PUSH_UP' || category === 'BENCH_PRESS' || nameLower.includes('press')) tags.push('push');
  if (category === 'PULL_UP' || category === 'ROW' || nameLower.includes('pull')) tags.push('pull');
  if (category === 'CARRY') tags.push('carry', 'grip strength');
  if (category === 'OLYMPIC_LIFT' || nameLower.includes('clean') || nameLower.includes('snatch') || nameLower.includes('jerk')) tags.push('olympic lift', 'power');
  if (category === 'PLYO') tags.push('plyometric', 'explosive', 'power');

  // Exercise characteristics
  if (nameLower.includes('single_leg') || nameLower.includes('single leg') || nameLower.includes('one_leg') || nameLower.includes('one leg')) tags.push('unilateral');
  if (nameLower.includes('single_arm') || nameLower.includes('single arm') || nameLower.includes('one_arm') || nameLower.includes('one arm')) tags.push('unilateral');
  if (category === 'PLANK' || nameLower.includes('isometric') || nameLower.includes('hold')) tags.push('isometric');
  if (category === 'CARDIO' || category === 'RUN' || category === 'BIKE_OUTDOOR') tags.push('cardio');
  if (category === 'WARM_UP') tags.push('mobility', 'flexibility', 'warmup');
  if (nameLower.includes('stability')) tags.push('stability');
  if (nameLower.includes('balance')) tags.push('balance');
  if (category === 'TOTAL_BODY' || nameLower.includes('burpee')) tags.push('full body', 'compound');

  return [...new Set(tags)]; // Remove duplicates
}

// Helper function to generate description
function generateDescription(name, category, equipment, tags) {
  const nameReadable = name.replace(/_/g, ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const categoryReadable = category.replace(/_/g, ' ').toLowerCase();

  // Build description
  let description = `${nameReadable} is a ${categoryReadable} exercise`;

  // Add primary muscle groups
  const muscleGroups = [];
  if (tags.includes('chest')) muscleGroups.push('chest');
  if (tags.includes('back')) muscleGroups.push('back');
  if (tags.includes('shoulders')) muscleGroups.push('shoulders');
  if (tags.includes('biceps')) muscleGroups.push('biceps');
  if (tags.includes('triceps')) muscleGroups.push('triceps');
  if (tags.includes('quads')) muscleGroups.push('quadriceps');
  if (tags.includes('hamstrings')) muscleGroups.push('hamstrings');
  if (tags.includes('glutes')) muscleGroups.push('glutes');
  if (tags.includes('calves')) muscleGroups.push('calves');
  if (tags.includes('core')) muscleGroups.push('core');
  if (tags.includes('abs')) muscleGroups.push('abs');

  if (muscleGroups.length > 0) {
    description += ` targeting the ${muscleGroups.join(', ')}`;
  }

  description += '.';

  // Add equipment info
  const equipmentList = equipment.filter(e => e !== 'bodyweight');
  if (equipmentList.length > 0) {
    description += ` Performed using ${equipmentList.join(', ')}.`;
  } else {
    description += ` This is a bodyweight exercise.`;
  }

  // Add special characteristics
  if (tags.includes('compound')) {
    description += ' This compound movement engages multiple muscle groups.';
  }
  if (tags.includes('unilateral')) {
    description += ' This unilateral exercise helps improve balance and address muscle imbalances.';
  }
  if (tags.includes('plyometric')) {
    description += ' This plyometric movement develops explosive power.';
  }
  if (tags.includes('isometric')) {
    description += ' This isometric exercise builds strength through static holds.';
  }
  if (tags.includes('olympic lift')) {
    description += ' This olympic lift requires proper technique and explosive power.';
  }

  return description;
}

// Generate SQL files for each category
const outputDir = path.join(__dirname, '../sql/garmin_exercises');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let totalExercises = 0;

Object.entries(exercisesByCategory).forEach(([category, exercises]) => {
  const type = determineType(category);
  const sqlStatements = [];

  sqlStatements.push(`-- Garmin Exercises: ${category}`);
  sqlStatements.push(`-- Total exercises: ${exercises.length}`);
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}\n`);

  exercises.forEach(exercise => {
    const equipment = extractEquipment(exercise.name, category);
    const tags = generateTags(exercise.name, category);
    const description = generateDescription(exercise.name, category, equipment, tags);

    // Escape single quotes in strings
    const escapedName = exercise.name.replace(/'/g, "''");
    const escapedCategory = category.replace(/'/g, "''");
    const escapedDescription = description.replace(/'/g, "''");
    const escapedTags = tags.map(t => t.replace(/'/g, "''"));
    const escapedEquipment = equipment.map(e => e.replace(/'/g, "''"));

    const tagsArray = escapedTags.length > 0 ? `'{${escapedTags.join(',')}}'` : "'{}'";
    const equipmentArray = escapedEquipment.length > 0 ? `'{${escapedEquipment.join(',')}}'` : "'{}'";

    const insertStatement = `INSERT INTO garmin_exercises (exercise_category, exercise_name, type, tags, equipment, description)
VALUES ('${escapedCategory}', '${escapedName}', '${type}', ${tagsArray}, ${equipmentArray}, '${escapedDescription}');`;

    sqlStatements.push(insertStatement);
  });

  totalExercises += exercises.length;

  const fileName = `${category.toLowerCase()}.sql`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, sqlStatements.join('\n\n'));

  console.log(`✓ Generated ${fileName} with ${exercises.length} exercises`);
});

console.log(`\n✓ Total: ${totalExercises} exercises across ${Object.keys(exercisesByCategory).length} categories`);
console.log(`✓ SQL files saved to: ${outputDir}`);
