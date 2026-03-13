
import fs from 'fs';

const generateDataset = () => {
  const headers = ['id', 'name', 'nationality', 'income', 'debtRatio', 'creditScore', 'loanAmount', 'riskProbability', 'decision', 'default'];
  const rows = [headers.join(',')];
  
  const names = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const nations = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Japan', 'Australia', 'Singapore'];

  const randNormal = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  for (let i = 0; i < 5000; i++) {
    const creditScore = Math.floor(Math.max(300, Math.min(850, 700 + randNormal() * 80)));
    const income = Math.floor(Math.exp(10.5 + randNormal() * 0.5));
    const debtRatio = Math.min(0.95, Math.abs(randNormal() * 0.15 + 0.3)).toFixed(4);
    const loanAmount = Math.floor(Math.max(5000, Math.min(100000, income * (0.1 + Math.random() * 0.4))));
    
    const score = ((creditScore - 300) / 550 * 0.6 + (1 - parseFloat(debtRatio)) * 0.3 + (income / 200000) * 0.1);
    const riskProb = (1 - score).toFixed(4);
    const decision = (creditScore > 660 && parseFloat(debtRatio) < 0.40) || (creditScore > 720 && parseFloat(debtRatio) < 0.50) ? 'Approve' : 'Reject';
    const isDefault = decision === 'Reject' ? 1 : 0;
    
    const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
    const nation = nations[Math.floor(Math.random() * nations.length)];

    rows.push([
      `LENDING-${10000 + i}`,
      `"${name}"`,
      nation,
      income,
      debtRatio,
      creditScore,
      loanAmount,
      riskProb,
      decision,
      isDefault
    ].join(','));
  }
  
  fs.writeFileSync('./dataset.csv', rows.join('\n'));
  console.log('Dataset generated with 5000 records.');
};

generateDataset();
