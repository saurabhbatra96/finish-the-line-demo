// The three charts of day 6, copied from the live game's data.
// Each entry: years, values, cut (index of the first hidden year), axis [min, max].
// Data: World Bank Open Data and Our World in Data (CC BY 4.0).
export const DAY = 6;

export const CHARTS = [
  {
    id: 'chn-sp-pop-65up-to-zs',
    title: 'People in China aged 65 or more',
    unit: '%',
    place: 'China',
    years: [1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025],
    values: [3.952,4.017,4.086,4.179,4.289,4.395,4.491,4.578,4.66,4.749,4.847,4.944,5.031,5.122,5.233,5.345,5.453,5.577,5.727,5.885,6.053,6.225,6.401,6.603,6.815,7.017,7.214,7.402,7.58,7.737,7.89,8.054,8.213,8.355,8.498,8.661,8.859,9.089,9.356,9.666,10.05,10.49,10.98,11.52,12.06,12.65,13.21,13.78,14.32,14.67,14.91],
    cut: 31,
    axis: [0, 15],
    source: 'https://data.worldbank.org/indicator/SP.POP.65UP.TO.ZS?locations=CN',
    sourceName: 'World Bank, Population ages 65 and above (% of total population)'
  },
  {
    id: 'usa-owid-income-share-top-1-before-tax-wid',
    title: 'Share of income that goes to the richest 1% in the United States',
    unit: '%',
    place: 'United States',
    years: [1945,1946,1947,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
    values: [14.25,14.28,14.97,16.31,15.72,16.39,16,14.97,14.01,13.95,14.61,13.84,13.53,12.68,13.21,12.43,12.53,12.84,12.98,13.11,13.03,12.97,12.37,12.61,11.6,10.7,11.05,11.08,10.88,10.37,10.43,10.36,10.58,10.35,10.86,10.42,10.67,10.99,11.5,12.15,12.27,11.98,13.24,15.21,14.69,14.71,13.65,14.68,14.15,14.02,14.52,15.25,16,16.32,16.76,17.34,16.59,16.1,16.32,17.06,18.06,18.52,18.38,17.93,16.7,17.89,18.08,19.49,18.46,18.97,18.89,18.66,19.05,19.24,19.04,18.17,19.88,20.73,20.73,20.73],
    cut: 33,
    axis: [4, 25],
    source: 'https://ourworldindata.org/grapher/income-share-top-1-before-tax-wid',
    sourceName: 'Our World in Data, from World Inequality Database (WID.world) (CC BY 4.0)'
  },
  {
    id: 'sau-sl-tlf-cact-fe-zs',
    title: 'Women in Saudi Arabia who work or look for work',
    unit: '%',
    place: 'Saudi Arabia',
    years: [1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025],
    values: [15.8,16.06,16.33,16.6,16.87,16.39,15.94,15.79,16.17,16.58,17.02,17.52,17.04,16.74,16.42,17.63,18.95,19.76,19.82,20.28,21.64,22.87,19.86,21.82,24.36,29.31,34.22,34.1,34.28,33.3,33.57],
    cut: 20,
    axis: [4.5, 35],
    source: 'https://data.worldbank.org/indicator/SL.TLF.CACT.FE.ZS?locations=SA',
    sourceName: 'World Bank, Labor force participation rate, female (% of female population ages 15+) (modeled ILO estimate)'
  }
];
