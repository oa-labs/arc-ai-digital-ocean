/**
 * Evalite Test Harness for Workplace Safety Q&A
 *
 * This test suite evaluates the quality of AI-generated responses
 * to workplace safety questions using Evalite metrics.
 */

import { evalite } from 'evalite';
import { Factuality, Levenshtein } from 'autoevals';

/**
 * Workplace Safety Q&A Evaluation
 */
evalite("Workplace Safety Q&A Evaluation", {
  data: async () => [
    {
      input: {
        question: "What are the steps to use a fire extinguisher?",
        actualOutput: "To use a fire extinguisher, remember the acronym PASS: Pull the pin, Aim at the base of the fire, Squeeze the handle, and Sweep from side to side. Always ensure you have a clear exit path and only fight small fires. If the fire is too large or you feel unsafe, evacuate immediately and call emergency services."
      },
      expected: "The PASS method should be used: Pull the pin, Aim at the base, Squeeze the handle, Sweep side to side.",
      context: [
        "Fire Safety Protocol: Use the PASS method for fire extinguishers - Pull, Aim, Squeeze, Sweep.",
        "Only attempt to extinguish small, contained fires. Evacuate for larger fires.",
        "Always maintain a clear exit path when using a fire extinguisher."
      ]
    },
    {
      input: {
        question: "What PPE is required when working in the warehouse?",
        actualOutput: "When working in the warehouse, you must wear: steel-toed safety boots, high-visibility vest, hard hat in designated areas, safety glasses, and work gloves when handling materials. Ear protection is required in high-noise zones marked with yellow signage. All PPE must meet OSHA standards and be inspected before use."
      },
      expected: "Required PPE includes safety boots, high-visibility vest, hard hat, safety glasses, and gloves.",
      context: [
        "Warehouse Safety Requirements: All personnel must wear steel-toed boots, high-visibility vests, and safety glasses.",
        "Hard hats are mandatory in areas marked with overhead hazard signs.",
        "Gloves must be worn when handling materials, and ear protection is required in designated high-noise zones.",
        "All PPE must comply with OSHA standards."
      ]
    },
    {
      input: {
        question: "What should I do if I hear the fire alarm?",
        actualOutput: "When you hear the fire alarm: immediately stop work, leave all personal belongings, proceed calmly to the nearest marked exit, use stairs only (never elevators), and gather at the designated assembly point in the north parking lot. Do not re-enter the building until authorized by emergency personnel or management. If you encounter smoke, stay low and use an alternate exit."
      },
      expected: "Stop work, leave belongings, exit via nearest marked exit using stairs, gather at assembly point, and wait for clearance.",
      context: [
        "Emergency Evacuation: Upon hearing the alarm, cease all activities and evacuate immediately.",
        "Use the nearest marked exit and stairs only. Elevators must not be used during emergencies.",
        "Assembly Point: All personnel must gather at the north parking lot.",
        "Do not re-enter the building until authorized by emergency responders.",
        "If smoke is present, stay low to the ground and use alternate exits."
      ]
    },
    {
      input: {
        question: "What should I do if there's a chemical spill?",
        actualOutput: "If you witness a chemical spill: evacuate the immediate area and alert others nearby, notify your supervisor and call the emergency hotline (ext. 911), do not attempt to clean up the spill unless you are trained and authorized, use the emergency eyewash station if you have skin or eye contact, and block off the area to prevent others from entering. The hazmat team will handle cleanup according to the material's SDS."
      },
      expected: "Evacuate the area, alert others, notify supervisor and emergency services, don't clean unless trained, use eyewash if exposed, and block the area.",
      context: [
        "Chemical Spill Protocol: Immediately evacuate the affected area and warn others.",
        "Contact your supervisor and the emergency response team (ext. 911).",
        "Only trained personnel should attempt spill cleanup.",
        "If exposed, use emergency eyewash or safety shower immediately.",
        "Secure the area to prevent unauthorized access until hazmat team arrives.",
        "All cleanup must follow the Safety Data Sheet (SDS) procedures."
      ]
    },
    {
      input: {
        question: "How do I report a workplace injury?",
        actualOutput: "To report a workplace injury: seek immediate medical attention if needed, notify your supervisor within 24 hours, complete an Incident Report Form available on the intranet or from HR, provide details including date, time, location, witnesses, and nature of injury, submit the form to HR and your supervisor, and follow up with any required medical documentation. All injuries, no matter how minor, must be reported to maintain accurate safety records."
      },
      expected: "Seek medical help if needed, notify supervisor within 24 hours, complete Incident Report Form with details, submit to HR and supervisor, and provide medical documentation.",
      context: [
        "Injury Reporting: All workplace injuries must be reported within 24 hours.",
        "First, seek appropriate medical attention for the injury.",
        "Complete the Incident Report Form with full details: date, time, location, witnesses, and injury description.",
        "Submit the form to both your immediate supervisor and Human Resources.",
        "Provide any medical documentation and follow-up reports as required.",
        "Even minor injuries must be documented for safety compliance and insurance purposes."
      ]
    }
  ],
  task: async (input) => input.actualOutput,
  scorers: [Levenshtein]
});
