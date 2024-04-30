import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const REACT_APP_SUPABASE_URL = "https://zjnvamrbnqzefncmdpaf.supabase.co";
const REACT_APP_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbnZhbXJibnF6ZWZuY21kcGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ0NjgzMDIsImV4cCI6MjAzMDA0NDMwMn0.O4S0x7F-5df2hR218qrO4VJbDOLK1Gzsvb3a8SGqwvY";


const supabaseUrl =REACT_APP_SUPABASE_URL
const supabaseKey =REACT_APP_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data, error } = await supabase.from('countries').select('name, continent');
    if (error) {
      console.error('Error fetching countries:', error.message);
    } else {
      console.log('Countries:', data);
      setCountries(data);
    }
  }

  const renderCountry = ({ item }) => (
    <View style={styles.countryContainer}>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.continent}>{item.continent}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Countries</Text>
      <FlatList
        data={countries}
        renderItem={renderCountry}
        keyExtractor={item => item.name}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  countryContainer: {
    marginBottom: 10,
  },
  countryName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  continent: {
    fontSize: 16,
    color: '#666',
  },
});
