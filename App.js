/*
-----------------------------------------------------------------

  _____       _
 |_   _|     | |
   | |  _ __ | |_ _ __ ___
   | | | '_ \| __| '__/ _ \
  _| |_| | | | |_| | | (_) |
 |_____|_| |_|\__|_|  \___/

Redux + React Native/Animated + Expo

Today to experiment, I wanted to create a code sample that
demonstrated the minimal amount of code for an application that
uses Redux, React Native, and Expo to list cryptocurrency prices.

Often there is some confusion around how to set everything up.
Especially for beginners. I wonder if seeing everything in one
file makes it easier.

-----------------------------------------------------------------
*/
import React from 'react';

/*
-----------------------------------------------------------------

   _____ _
  / ____| |
 | (___ | |_ ___  _ __ ___
  \___ \| __/ _ \| '__/ _ \
  ____) | || (_) | | |  __/
 |_____/ \__\___/|_|  \___|


- A reducer is something we pass into createStore that informs
  us of how we may reduce the new state of the our store.
- We will use the redux store in this project to keep the value
  of BTC, LTC, Euro and ETH relative to the US Dollar.

-----------------------------------------------------------------
*/
import { createStore } from 'redux';

const INITIAL_STATE = {
  btc: 0,
  ltc: 0,
  euro: 0,
  eth: 0,
  isAvailable: false,
};

const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'UPDATE_STATE':
      return { ...state, ...action.state };
  }
};

const store = createStore(reducer, {});

/*
-----------------------------------------------------------------

   _____                                             _
  / ____|                                           | |
 | |     ___  _ __ ___  _ __   ___  _ __   ___ _ __ | |_ ___
 | |    / _ \| '_ ` _ \| '_ \ / _ \| '_ \ / _ \ '_ \| __/ __|
 | |___| (_) | | | | | | |_) | (_) | | | |  __/ | | | |_\__ \
  \_____\___/|_| |_| |_| .__/ \___/|_| |_|\___|_| |_|\__|___/
                       | |
                       |_|

- See AppScreen, and ConnectedAppScreen to see how to get access
  to the redux state.
- Not every single value needs to be stored in the redux store.
- See PriceSectionComponent to see an example of how to animate on
  state change.
- Async/Await examples for how to fetch data and dispatch the change
  to the store.

-----------------------------------------------------------------
*/
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Slider,
} from 'react-native';
import { Font } from 'expo';
import { Provider, connect } from 'react-redux';

const API_BTCUSD_PRICE = 'https://api.cryptowat.ch/markets/gdax/btcusd/price';
const API_ETHUSD_PRICE = 'https://api.cryptowat.ch/markets/gdax/ethusd/price';
const API_LTCUSD_PRICE = 'https://api.cryptowat.ch/markets/gdax/ltcusd/price';
const API_EUROUSD_PRICE =
  'https://api.cryptowat.ch/markets/bitstamp/eurusd/price';

const mapStateToProps = state => {
  return { ...state };
};

const numberWithCommas = x => {
  let parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const fetchPrice = async source => {
  const response = await fetch(source);
  const json = await response.json();
  return json.result.price;
};

class PriceSectionComponent extends React.Component {
  state = {
    display: new Animated.Value(this.props.top),
    value: this.props.top,
  };

  componentWillReceiveProps(nextProps) {
    Animated.timing(this.state.display, {
      toValue: nextProps.top,
      duration: 600,
    }).start();
  }

  componentDidMount() {
    this.state.display.addListener(({ value }) => {
      this.setState({ value });
    });
  }

  render() {
    const valueToRender = numberWithCommas(
      this.state.value.toFixed(this.props.fixed)
    );

    return (
      <View style={styles.priceSection}>
        <Text
          style={[styles.priceSectionTop, { fontFamily: 'neue-haas-unica' }]}>
          {this.props.symbol ? `${this.props.symbol} ` : undefined}
          {valueToRender}
        </Text>
        <Text
          style={[
            styles.priceSectionBottom,
            { fontFamily: 'neue-haas-unica' },
          ]}>
          {this.props.bottom}
        </Text>
      </View>
    );
  }
}

class AppScreen extends React.Component {
  state = {
    value: 1,
  };

  async componentDidMount() {
    const btc = await fetchPrice(API_BTCUSD_PRICE);
    const ltc = await fetchPrice(API_LTCUSD_PRICE);
    const eth = await fetchPrice(API_ETHUSD_PRICE);
    const euro = await fetchPrice(API_EUROUSD_PRICE);

    this.props.dispatch({
      type: 'UPDATE_STATE',
      state: { btc, ltc, eth, euro, isAvailable: true },
    });
  }

  _handleUpdateConversion = value => this.setState({ value });

  render() {
    if (!this.props.isAvailable) {
      return null;
    }

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
        <PriceSectionComponent
          top={this.state.value}
          bottom="United States Dollar"
          symbol="$"
          fixed={2}
        />
        <PriceSectionComponent
          top={Number(this.state.value / this.props.euro)}
          bottom="Euro"
          symbol="€"
          fixed={2}
        />

        <Slider
          style={styles.slider}
          maximumValue={1000000}
          minimumValue={1}
          step={1}
          value={this.state.value}
          onSlidingComplete={this._handleUpdateConversion}
        />
        <PriceSectionComponent
          top={Number(this.state.value / this.props.ltc)}
          bottom="Litecoin"
          symbol="LTC"
          fixed={3}
        />

        <PriceSectionComponent
          top={Number(this.state.value / this.props.eth)}
          bottom="Ethereum"
          symbol="ETH"
          fixed={4}
        />

        <PriceSectionComponent
          top={Number(this.state.value / this.props.btc)}
          bottom="Bitcoin"
          symbol="BTC"
          fixed={5}
        />

      </View>
    );
  }
}

const ConnectedAppScreen = connect(mapStateToProps)(AppScreen);

/*
-----------------------------------------------------------------

  _____             _
 |  __ \           | |
 | |__) |___   ___ | |_
 |  _  // _ \ / _ \| __|
 | | \ \ (_) | (_) | |_
 |_|  \_\___/ \___/ \__|

- This is an example of a pattern that can be used to only render
  child components once the fonts have been loaded.

-----------------------------------------------------------------
*/

export default class RootComponent extends React.Component {
  state = {
    loaded: false,
  };

  async componentDidMount() {
    await Font.loadAsync({
      'neue-haas-unica': require('./assets/fonts/neue-haas-unica.ttf'),
    });

    this.setState({
      loaded: true,
    });
  }

  render() {
    return (
      <Provider store={store}>
        {this.state.loaded ? <ConnectedAppScreen /> : <View />}
      </Provider>
    );
  }
}

/*
-----------------------------------------------------------------

   _____ _         _
  / ____| |       | |
 | (___ | |_ _   _| | ___  ___
  \___ \| __| | | | |/ _ \/ __|
  ____) | |_| |_| | |  __/\__ \
 |_____/ \__|\__, |_|\___||___/
              __/ |
             |___/
- Here is an example of how to define styles that can be used
  throughout your components.
- You can not use something like `neue-haas-unica` because it
  hasn't been loaded async.

-----------------------------------------------------------------
*/
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  slider: {
    width: '100%',
  },
  priceSection: {
    width: '100%',
    padding: 16,
  },
  priceSectionTop: {
    color: '#FFFFFF',
    fontSize: 32,
  },
  priceSectionBottom: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
  },
});
